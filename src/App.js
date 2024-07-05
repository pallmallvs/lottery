import React, { useState, useEffect, useRef } from 'react';
import web3 from './web3';
import lottery from './lottery';
import './styles.css';

const App = () => {
  const [accounts, setAccounts] = useState([]);
  const [currentAddress, setCurrentAddress] = useState('');
  const [adminAddress, setAdminAddress] = useState('');
  const [adminAddress2, setAdminAddress2] = useState('');
  const [isDrawingComplete, setIsDrawingComplete] = useState(false);
  const [elonTicketCount, setElonTicketCount] = useState(0);
  const [markTicketCount, setMarkTicketCount] = useState(0);
  const [samTicketCount, setSamTicketCount] = useState(0);
  const [winners, setWinners] = useState( );
  const [contractValue, setContractValue] = useState(0);
  const [ticketHistory, setTicketHistory] = useState([]);
  const [winningImage, setWinningImage] = useState(null);
  const [winningImageScale, setWinningImageScale] = useState('100%');
  const metamaskAlertShownRef = useRef(false);
  const walletPromptShownRef = useRef(false);
  const [hideElements, setHideElements] = useState(true);
  const [wallet, setWallet] = useState(0);
  const [tickets,setticket] = useState(0);
       
  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          if (!metamaskAlertShownRef.current) {
            alert("Metamask is installed. Make sure you are on Sepoila network. Thanks!");
            metamaskAlertShownRef.current = true;
          }

          const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
          console.log('Metamask accounts:', accs);
          setAccounts(accs);

          if (!walletPromptShownRef.current) {
            let x = parseInt(prompt("Please input which wallet you will use (1, 2, 3...)")) - 1;
            setWallet(x);
            walletPromptShownRef.current = true;
          }

          setCurrentAddress(accs[wallet]);

          const admin = await lottery.methods.owner().call();
          const admin2 = await lottery.methods.owner2().call();
          setAdminAddress(admin);
          setAdminAddress2(admin2);

          if (accs[wallet].toLowerCase() === admin.toLowerCase() || accs[wallet].toLowerCase() === admin2.toLowerCase()) {
            console.log("Same account as admin");
            setHideElements(false);
          }else{setHideElements(true);}

          const drawingStatus = await lottery.methods.isDrawingComplete().call();
          setIsDrawingComplete(drawingStatus);
        } else {
          alert("Metamask not installed. You can't visit this page.");
        }
      } catch (error) {
        console.error('Error connecting to web3', error);
      }
    };

    init();
  }, [wallet]);

  useEffect(() => {
    const fetchData = async () => {
      try {
          
        const tickets = await lottery.methods.getTicketsBought(currentAddress).call();
        console.log(tickets);
        setticket(Number(tickets));
        const elonCount = await lottery.methods.elonParticipantsLength().call();
          
		    const markCount = await lottery.methods.markParticipantsLength().call();
        const samCount = await lottery.methods.samParticipantsLength().call();
        const contractPrice = await lottery.methods.getContractValue().call();
        const priceInEther = web3.utils.fromWei(contractPrice, 'ether');
		
        setContractValue(priceInEther);
        setElonTicketCount(Number(elonCount));
        setMarkTicketCount(Number(markCount));
        setSamTicketCount(Number(samCount));

        const drawingStatus = await lottery.methods.isDrawingComplete().call();
        setIsDrawingComplete(drawingStatus);

        if (drawingStatus) {
          const WinnerStatus = await lottery.methods.Winner().call();
          console.log(WinnerStatus);
          setWinners(WinnerStatus);
          
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 1000);

    return () => clearInterval(interval);
  }, []);

  const toggleDrawingStatus = async () => {
    try {
      await lottery.methods.toggleDrawingStatus().send({ from: accounts[wallet] });
      setIsDrawingComplete(!isDrawingComplete);
      console.log('Drawing status toggled successfully');
    } catch (error) {
      console.error('Error toggling drawing status:', error);
    }
  }; 
   
  const revealWinners = async () => {
    try {
      await lottery.methods.revealWinners().send({ from: accounts[wallet] });
      setIsDrawingComplete(true);
      console.log('Winners revealed successfully');
    } catch (error) {
      console.error('Error revealing winners:', error);
    }
  };

  const buyTicket = async (ticketType) => {
    try {
      if (!isDrawingComplete) {
        await lottery.methods[`buy${ticketType}Ticket`]().send({
          from: accounts[wallet],
          value: web3.utils.toWei('0.01', 'ether'),
        });
        console.log(`Bought ${ticketType} ticket successfully`);
        alert(`Bought ${ticketType} ticket successfully`);
      } else {
        alert("Drawing already completed; you can't buy tickets");
      }
    } catch (error) {
      console.error('Error buying ticket:', error);
    }
  };

  const withdrawFunds = async () => {
    try {
      await lottery.methods.withdrawFunds().send({ from: accounts[wallet] });
      console.log('Funds withdrawn successfully');
    } catch (error) {
      console.error('Error withdrawing funds:', error);
    }
  };

  const restartLottery = async () => {
    try {
      await lottery.methods.restartLottery().send({ from: accounts[wallet] });
      setIsDrawingComplete(false);
      console.log('Lottery restarted successfully');
    } catch (error) {
      console.error('Error restarting lottery:', error);
    }
  };

  const transferOwnership = async (newOwner) => {
    try {
      await lottery.methods.transferOwnership(newOwner).send({ from: accounts[wallet] });
      console.log('Ownership transferred successfully');
    } catch (error) {
      console.error('Error transferring ownership:', error);
    }
  };

  const selfDestruct = async () => {
    try {
      await lottery.methods.selfDestruct().send({ from: accounts[wallet] });
      console.log('Contract self-destructed successfully');
    } catch (error) {
      console.error('Error self-destructing contract:', error);
    }
  };

  const fetchTicketHistory = async () => {
    try {
        // Fetch the latest ticket history entries
        const entries = await lottery.methods.getTicketHistoryEntries().call();
        
		 // Process BigInt fields before setting state
            const processedHistory = entries.map(entry => ({
                participant: entry.participant,
                itemType: entry.itemType,
                timestamp: Number(entry.timestamp) // Convert BigInt timestamp to number
            }));
		
		
		
		
        // Process and set the ticket history
        setTicketHistory(processedHistory);
        console.log('Ticket history fetched:', entries);
    } catch (error) {
        console.error('Error fetching ticket history:', error);
        alert('Error fetching ticket history. Please check console for details.');
    }
};

  // Setup event listeners for WinnersRevealed event
  useEffect(() => {
    const setupEventListeners = async () => {
      try {
        const winnersRevealedEvent = lottery.events.WinnersRevealed({ fromBlock: 'latest' });

        winnersRevealedEvent.on('data', async (event) => {
          const winnerName = event.returnValues.winner.toLowerCase();
          console.log('Winner revealed:', winnerName);

          // Set winning image and scale
          setWinningImage(winnerName);
          setWinningImageScale('125%'); // Scale up by 25%
        });

        winnersRevealedEvent.on('error', (error) => {
          console.error('Error fetching winners:', error);
        });
      } catch (error) {
        console.error('Error setting up event listener:', error);
      }
    };

    if (accounts.length > 0 && !metamaskAlertShownRef.current) {
      setupEventListeners();
      metamaskAlertShownRef.current = true;
    }
  }, [accounts]);

  return (
    <div>
      <h1 id="text">Lottery iis20113</h1>
      <div className="container" style={{ display: 'flex' }}>
        <div>
          <p>Current Address: <br /> {currentAddress}</p>
          <p>Admin Address: <br /> {adminAddress}</p>
          <p>Second Admin: <br /> {adminAddress2}</p>
        </div>
        <div className="container" style={{ display: 'flex', flexDirection: 'column' }}>
          <p>Contract Value: {contractValue} <br /></p>
          <p>Is drawing completed: {isDrawingComplete.toString()}</p>
        </div>
      </div>
      <br />
      <div className="container" style={{ display: 'flex', flexDirection: '' }}>
        <div className="item">
          <img src={require('./elon.jpg')} alt="elon" style={{ width: '255px', height: '255px' }} />
          <p>Elon Tickets Bought: {elonTicketCount}</p>
          <button onClick={() => buyTicket('elon')}>Buy Elon Ticket</button>
        </div>
        <div className="item">
          <img src={require('./mark.jpeg')} alt="mark" style={{ width: '255px', height: '255px' }} />
          <p>Mark Tickets Bought: {markTicketCount}</p>
          <button onClick={() => buyTicket('mark')}>Buy Mark Ticket</button>
        </div>
        <div className="item">
          <img src={require('./sam.jpg')} alt="sam" style={{ width: '255px', height: '255px' }} />
          <p>Sam Tickets Bought: {samTicketCount}</p>
          <button onClick={() => buyTicket('sam')}>Buy Sam Ticket</button>
        </div>
      
      </div>
      <div className="container" style={{ display: 'flex', flexDirection: '' }}>
      <p> tickets bought : {tickets} Max 5 tickets allowed after transaction would be rejected </p>
      </div>
        
      <br />
      <div className="container" style={{ display: 'flex', flexDirection: 'column' }}>
        <p>
          Winner: {winners}
        </p>
       
      </div>
      <br />
      <div className="container" style={{ display: 'flex', flexDirection: 'column' }}>
        Admin content will auto-visible when admin or admin2 is connected:
        <button onClick={toggleDrawingStatus} style={{ display: hideElements ? 'none' : 'block', height: '35px', marginTop: '5px' }}>
          {isDrawingComplete ? 'Change Drawing' : 'Change Drawing'}
        </button>
        <button onClick={revealWinners} style={{ display: hideElements ? 'none' : 'block', height: '35px', marginTop: '5px' }}>Reveal Winners</button>
        <button onClick={withdrawFunds} style={{ display: hideElements ? 'none' : 'block', height: '35px', marginTop: '5px' }}>Withdraw Funds</button>
        <button onClick={restartLottery} style={{ display: hideElements ? 'none' : 'block', height: '35px', marginTop: '5px' }}>Restart Lottery</button>
        <div className="container" style={{ display: 'flex' }}>
          <input style={{ display: hideElements ? 'none' : 'block' }}
            type="text"
            placeholder="New Owner Address"
            onChange={(e) => transferOwnership(e.target.value)}
          />
          <button onClick={() => transferOwnership()} style={{ display: hideElements ? 'none' : 'block' }}>Transfer Ownership</button>
          <button onClick={selfDestruct} style={{ display: hideElements ? 'none' : 'block' }}>Self-Destruct Contract</button>
        </div>
        <div>
		<button onClick={fetchTicketHistory} style={{  height: '35px', marginTop: '5px' }}>Fetch Ticket History</button>
        
          <h2>Ticket History</h2>
          <ul>
            {ticketHistory.map((entry, index) => (
              <li key={index}>
                Participant: {entry.participant}, Item Type: {entry.itemType}, Timestamp: {new Date(entry.timestamp * 1000).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <br />
      {winningImage && (
        <div style={{ textAlign: 'center' }}>
          <img src={require(`./${winningImage}.jpg`)} alt={winningImage} style={{ width: winningImageScale, height: winningImageScale }} />
        </div>
      )}
    </div>
  );
};

export default App;
