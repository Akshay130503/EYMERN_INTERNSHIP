import React, { useState } from 'react';

function AuctionItem({ item }) {
  const [bid, setBid] = useState(0);
  const [message, setMessage] = useState('');

  const handleBid = () => {
    if (bid <= item.currentBid) {
      setMessage('Bid must be higher than the current bid.');
      return;
    }
    setMessage(`Bid placed successfully: $${bid}`);
  };

  return (
    <div>
      <h2>{item.itemName}</h2>
      <p>{item.description}</p>
      <p>Current Bid: ${item.currentBid}</p>
      <p>Highest Bidder: {item.highestBidder || 'No bids yet'}</p>
      <input
        type="number"
        value={bid}
        onChange={(e) => setBid(Number(e.target.value))}
        placeholder="Enter your bid"
      />
      <button onClick={handleBid}>Place Bid</button>
      {message && <p className="message">{message}</p>}
    </div>
  );
}

export default AuctionItem;
