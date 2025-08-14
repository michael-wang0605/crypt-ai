import os
import uuid
import hashlib
from typing import Optional

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from web3 import Web3, HTTPProvider

# ===== env =====
load_dotenv()
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

RPC_URL = os.getenv("RPC_URL", "https://polygon-amoy-bor-rpc.publicnode.com")
CONTRACT_ADDRESS = os.getenv("CONTRACT_ADDRESS")
PRIVATE_KEY = os.getenv("PRIVATE_KEY")

if not all([GROQ_API_KEY, RPC_URL, CONTRACT_ADDRESS, PRIVATE_KEY]):
    print("⚠️ Missing env vars. Required: GROQ_API_KEY, RPC_URL, CONTRACT_ADDRESS, PRIVATE_KEY")

# ===== ABI for ChatProof.sol =====
CONTRACT_ABI = [
	{
		"anonymous": False,
		"inputs": [
			{
				"indexed": True,
				"internalType": "bytes32",
				"name": "chatHash",
				"type": "bytes32"
			},
			{
				"indexed": False,
				"internalType": "uint256",
				"name": "timestamp",
				"type": "uint256"
			},
			{
				"indexed": True,
				"internalType": "address",
				"name": "sender",
				"type": "address"
			}
		],
		"name": "ChatStored",
		"type": "event"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "chatHash",
				"type": "bytes32"
			}
		],
		"name": "storeChatHash",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	}
]

# ===== web3 =====
w3 = Web3(HTTPProvider(RPC_URL, request_kwargs={"timeout": 15}))
account = w3.eth.account.from_key(PRIVATE_KEY)
contract = w3.eth.contract(address=w3.to_checksum_address(CONTRACT_ADDRESS), abi=CONTRACT_ABI)

# ===== app =====
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # adjust for prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory proof store: id -> {"status": "pending"|"ok"|"error", "tx_hash": Optional[str], "error": Optional[str]}
PROOFS: dict[str, dict] = {}

class PromptRequest(BaseModel):
    messages: list
    model: str = "llama3-70b-8192"

@app.get("/health")
def health():
    try:
        _ = w3.is_connected()
        return {"ok": True, "chain_connected": bool(_)}
    except Exception as e:
        return {"ok": True, "chain_connected": False, "err": str(e)}

def write_hash_to_chain(chat_hash: bytes, proof_id: str):
    try:
        nonce = w3.eth.get_transaction_count(account.address, 'pending')
        tx = contract.functions.storeChatHash(chat_hash).build_transaction({
            "from": account.address,
            "nonce": nonce,
            "chainId": 80002,
            "maxFeePerGas": w3.to_wei("100", "gwei"),
            "maxPriorityFeePerGas": w3.to_wei("25", "gwei"),
            "gas": 200000,
        })
        signed = w3.eth.account.sign_transaction(tx, PRIVATE_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
        tx_hash_hex = w3.to_hex(tx_hash)  # <-- includes 0x

        PROOFS[proof_id] = {
            "status": "ok",
            "tx_hash": tx_hash_hex,
            "explorer_url": f"https://amoy.polygonscan.com/tx/{tx_hash_hex}",
            "error": None,
        }
    except Exception as e:
        PROOFS[proof_id] = {"status": "error", "tx_hash": None, "explorer_url": None, "error": str(e)}
        print("⚠️ chain write failed:", e)

@app.get("/proof/{proof_id}")
def get_proof(proof_id: str):
    data = PROOFS.get(proof_id)
    if not data:
        return {"status": "unknown", "tx_hash": None, "explorer_url": None}
    return data

@app.post("/chat")
async def chat(prompt: PromptRequest, background_tasks: BackgroundTasks):
    # 1) Call Groq
    headers = {"Authorization": f"Bearer {GROQ_API_KEY}", "Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            groq_response = await client.post(GROQ_API_URL, json=prompt.dict(), headers=headers)
    except Exception as e:
        print("🟡 Groq request failed:", e)
        return {"reply": "⚠️ LLM request failed. Try again.", "proof_id": None}

    if groq_response.status_code != 200:
        print("🟡 Groq non-200:", groq_response.status_code, groq_response.text[:500])
        return {"reply": "⚠️ LLM error. Try again.", "proof_id": None}

    groq_json = groq_response.json()
    reply = groq_json.get("choices", [{}])[0].get("message", {}).get("content", "") or ""

    # 2) Hash prompt + reply
    combined = f"{prompt.messages}{reply}".encode()
    chat_hash = hashlib.sha256(combined).digest()

    # 3) Queue background chain write (non-blocking)
    proof_id = uuid.uuid4().hex
    PROOFS[proof_id] = {"status": "pending", "tx_hash": None, "explorer_url": None, "error": None}
    background_tasks.add_task(write_hash_to_chain, chat_hash, proof_id)

    # 4) Return immediately with reply + proof_id (UI can poll /proof/{id})
    return {
        "reply": reply,
        "proof_id": proof_id,
        "proof_status_url": f"/proof/{proof_id}",
        "explorer_base": "https://amoy.polygonscan.com/tx/",
    }