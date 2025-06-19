import React, { useState } from "react";
import { ethers } from "ethers";
import abi from "./abi.json";

const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS;

function App() {
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState("");
  const [mintedMetadata, setMintedMetadata] = useState(null);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const [selectedAccount] = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(selectedAccount);
        console.log("Wallet connected:", selectedAccount);
      } catch (error) {
        console.error("Error connecting wallet:", error);
      }
    } else {
      console.error("MetaMask is not installed");
    }
  };

  // Call safeMint()
  const mintNFT = async () => {
    if (!account) return alert("Please connect wallet first!");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    try {
      // Mint
      const tx = await contract.safeMint(
        account,
        "ipfs://bafkreiakh7cr3f2x44up5tgtewnwg6prptqpr377osed3awtiwezyoup4m"
      );
      setStatus("Minting... please wait for confirmation...");
      const receipt = await tx.wait();
      console.log(receipt);

      const event = receipt.events.find((e) => e.event === "Minted");
      const mintedIdEvent = event.args.tokenId.toNumber();

      console.log("Minted ID:", mintedIdEvent);

      // ✅ Get the next tokenId from contract
      const nextId = await contract._nextTokenId();
      const mintedId = nextId.toNumber() - 1;

      // ✅ Get the token URI
      const uri = await contract.tokenURI(mintedId);
      console.log("tokenURI from contract:", uri);
      const metadataURL = uri.replace("ipfs://", "https://ipfs.io/ipfs/");
      const metadata = await fetch(metadataURL).then((res) => res.json());

      console.log("Minted NFT Metadata:", metadata);

      setStatus(`Minted! ${metadata.name}`);
      // Optionally store metadata in state if you want to render the image too
      setMintedMetadata(metadata);
    } catch (err) {
      console.error(err);
      setStatus("Mint failed: " + err.message);
    }
  };

  return (
    <div className="flex flex-col items-center p-8">
      <h1 className="text-2xl font-bold mb-4">BeartTest NFT Mint</h1>
      <button
        onClick={connectWallet}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-4"
      >
        {account ? `Connected: ${account.slice(0, 6)}...` : "Connect Wallet"}
      </button>

      <button
        onClick={mintNFT}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Mint NFT
      </button>

      {status && <p className="mt-4">{status}</p>}

      {mintedMetadata && (
        <div className="mt-8 p-4 border rounded shadow">
          <h2 className="text-xl font-bold mb-2">{mintedMetadata.name}</h2>
          <img
            src={mintedMetadata.image.replace(
              "ipfs://",
              "https://ipfs.io/ipfs/"
            )}
            alt={mintedMetadata.name}
            className="w-64 h-64 object-cover rounded"
          />
          <p className="mt-2">{mintedMetadata.description}</p>
        </div>
      )}
    </div>
  );
}

export default App;
