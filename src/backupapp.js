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
  const [elonTicketCount, setelonTicketCount] = useState(0);
  const [markTicketCount, setmarkTicketCount] = useState(0);
  const [samTicketCount, setsamTicketCount] = useState(0);
  const [winners, setWinners] = useState({ elonWinner: null, markWinner: null, samWinner: null });
  const [contractValue, setContractValue] = useState(0);
  const winnersAlerted = useRef(false);
  const [hideElements, setHideElements] = useState(true); 
  
  const [wallet, setWallet] = useState(0);
  const metamaskAlertShownRef = useRef(false);
  const walletPromptShownRef = useRef(false);
  const [ticketHistory, setTicketHistory] = useState([]); 
  


//remove title effect
  useEffect(() => {
        const timer = setTimeout(() => {
            
            const elementToRemove = document.getElementById('text');
            if (elementToRemove) {
                elementToRemove.remove();
            }
        }, 3000); 

        return () => {
            clearTimeout(timer);
        };
    }, []);
  
  
  
  
  
  
  useEffect(() => {
	  
    const init = async () => {
  try {
	  let isMetamaskAlertShown = false;
      let isWalletPromptShown = false;
    if(window.ethereum){
	
	// Log Metamask status
    console.log('Metamask is installed:', window.ethereum);
   	if (!metamaskAlertShownRef.current){
	alert("metamask is installed make sure you are on sepoila  network thanks");
	metamaskAlertShownRef.current = true;
	}

    // Get Metamask accounts
    // check and if not acount reject
    const accs = await window.ethereum.request({ method: 'eth_requestAccounts' });
	console.log(accs);
    console.log('Metamask accounts:', accs);
	 if (!walletPromptShownRef.current) {
	 let x= parseInt(prompt("please input wich wallet you will use (1,2,3...)"))-1;
		setWallet(x);
		walletPromptShownRef.current = true;
	 
	 }
	setAccounts(accs);
    setCurrentAddress(accs[wallet]);
	console.log("choosed wallet",wallet);
    const admin = await lottery.methods.owner().call();
	const admin2 = await lottery.methods.owner2().call();
    setAdminAddress(admin);
	setAdminAddress2(admin2);
	if(accs[wallet].toLowerCase()===admin.toLowerCase() || accs[wallet].toLowerCase()===admin2.toLowerCase()){
		console.log("same acc as admin");
		setHideElements(false);
		
	};

    const drawingStatus = await lottery.methods.isDrawingComplete().call();
    setIsDrawingComplete(drawingStatus);
	}else{
		
		alert("metamask not installed");
		alert("you cant visit page")
		
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
        // Fetch ticket counts
        const elonCount = await lottery.methods.elonParticipantsLength().call();
        const markCount = await lottery.methods.markParticipantsLength().call();
        const samCount = await lottery.methods.samParticipantsLength().call();
        const contractPrice = await lottery.methods.getContractValue().call();
        const priceInEther = web3.utils.fromWei(contractPrice, 'ether');
		console.log("auto fetching data");
        setContractValue(priceInEther);
		console.log(priceInEther,contractPrice);
        setelonTicketCount(Number(elonCount));
        setmarkTicketCount(Number(markCount));
        setsamTicketCount(Number(samCount));

        // Fetch drawing completion status
        const drawingStatus = await lottery.methods.isDrawingComplete().call();
        setIsDrawingComplete(drawingStatus); 
		
        if (drawingStatus) {
          const elonwinnerStatus = await lottery.methods.elonwinneraddress().call();
          const markwinnerStatus = await lottery.methods.markWinneraddress().call();
          const samwinnerStatus = await lottery.methods.samWinneraddress().call();
		  console.log(markwinnerStatus);
		  console.log(elonwinnerStatus);
		  console.log(samwinnerStatus);
		  
          setWinners({
            elonWinner: elonwinnerStatus.toString().toLowerCase(),
            markWinner: markwinnerStatus.toString().toLowerCase(),
            samWinner: samwinnerStatus.toString().toLowerCase(),
          });
		  //if(currentAddress.toLowerCase()==carwinnerStatus.toLowerCase()){
			//setWinners({carWinner: "you win"})} ;
			  
		  //if(currentAddress.toLowerCase()==phonewinnerStatus.toLowerCase()){
			//  setWinners({phoneWinner: "you win"})};
          //if(currentAddress.toLowerCase()==computerwinnerStatus.toLowerCase()){
			//  setWinners({computerWinner: "you win"})};			  
			winnersAlerted.current = true;
			
		//alert(
          //  'Drawing complete winners:' +
           //   carwinnerStatus.toString() +
             // phonewinnerStatus.toString() +
             // computerwinnerStatus.toString()
          //);

          
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData(); // Fetch data immediately

    const interval = setInterval(fetchData, 1000); // Fetch data every second

    // Cleanup function to clear the interval when the component unmounts
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

  const setupEventListeners = async () => {
    const lotteryContract = lottery.options.address;

    const winnersRevealedEvent = lottery.events.WinnersRevealed({ fromBlock: 'latest' });

    winnersRevealedEvent.on('data', async (event) => {
	
	/////////////////
	console.log(event);
      console.log(event.returnValues);
      const winnersData = event.returnValues;
      setWinners(winnersData);
    });

    winnersRevealedEvent.on('error', (error) => {
      console.error('Error fetching winners:', error);
    });
  };

  const setupEventListenerss = async () => {
    const lotteryContract = lottery.options.address;

    const ticketEvent = lottery.events.TicketBought({ fromBlock: 'latest' }).call();
	
    ticketEvent.on('data', async (event) => {
	  alert(event);
      alert('Ticket bought ::: ' + event.returnValues.item);
      setTimeout(5);
    });

    ticketEvent.on('error', (error) => {
      console.error('Error fetching winners:', error);
    });
  };

  const buyTicket = async (ticketType) => {
    try {
      if (isDrawingComplete !== 'true') {
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

  const revealWinners = async () => {
    try {
      await lottery.methods.revealWinners().send({ from: accounts[wallet] });
      setIsDrawingComplete(true);
      console.log('Winners revealed successfully');
    } catch (error) {
      console.error('Error revealing winners:', error);
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

// Function to fetch ticket history
const fetchTicketHistory = async () => {
  try {
    const historyLength = await lottery.methods.getTicketHistoryLength().call();
    const history = [];

    for (let i = historyLength - 1; i >= 0 && i >= historyLength - 10; i--) {
      const entry = await lottery.methods.getTicketHistoryEntry(i).call();
      history.push(entry);
    }

    setTicketHistory(history);
    console.log('Ticket history fetched:', history);
  } catch (error) {
    console.error('Error fetching ticket history', error);
    alert('Error fetching ticket history. Please check console for details.');
  }
};


  return (
 
    <div>
      <h1 id="text">Lottery iis20113</h1>
   <div className="container" style={{ display: 'flex' }}>
	  <div>
      <p>Current Address: <br /> {currentAddress}</p>

      <p>Admin Address: <br /> {adminAddress}</p>
	  <p>second admin: <br /> {adminAddress2}</p>
	</div>
      <div className="container" style={{ display: 'flex',flexDirection:'column' }}>
	
	  <p>Contract Value: {contractValue} <br /></p>
	 
	 <p>Is drawing completed: {isDrawingComplete.toString()}</p>
	 </div>
	 </div>
    <br />
   <div className="container" style={{ display: 'flex', flexDirection: '' }}>
            <div className="item">
                <img src={require('./car.jpg')} alt="elon" style={{ width: '255px', height: '255px' }} />
                <p>elon Tickets Bought: {elonTicketCount}</p>
                <button onClick={() => buyTicket('elon')}>Buy elon Ticket</button>		
            </div>
            <div className="item">
                <img src={require('./phone.jpeg')} alt="mark" style={{ width: '255px', height: '255px' }} />
                <p>mark Tickets Bought: {markTicketCount}</p>
                <button onClick={() => buyTicket('mark')}>Buy mark Ticket</button>
            </div>
            <div className="item">
                <img src={require('./pc.jpg')} alt="sam" style={{ width: '255px', height: '255px' }} />
                <p>sam Tickets Bought: {samTicketCount}</p>
                <button onClick={() => buyTicket('sam')}>Buy sam Ticket</button>
            </div>
        </div>
	<br />
   <div className="container" style={{ display: 'flex' ,flexDirection:'column' }}>
	 <p>
	elon Winner: {winners.elonWinner
		? winners.elonWinner === currentAddress.toLowerCase()
		? 'You win'
		: 'No win'
		: 'No drawn completed'}
	</p>
	<p>
	mark Winner: {winners.markWinner
		? winners.markWinner === currentAddress.toLowerCase()
		? 'You win'
		: 'No win'
		: 'No drawn completed'}
	</p>
	<p>
	sam Winner: {winners.samWinner
		? winners.samWinnerWinner === currentAddress.toLowerCase()
		? 'You win'
		: 'No win'
		: 'No drawn completed'}
	</p>




	</div>
      
      
      <br />
	  <div className="container" style={{ display: 'flex' ,flexDirection:'column' }}>
		admin content will auto visible when admin or admin2 is connected:
		<button onClick={toggleDrawingStatus} style={{ display: hideElements ? 'none' : 'block' , height:'35px',marginTop:'5px'}}>
			{isDrawingComplete ? 'Change Drawing' : 'Change Drawing'}
		</button>
    <button onClick={fetchTicketHistory} style={{ display: hideElements ? 'none' : 'block', height: '35px', marginTop: '5px' }}>Fetch Ticket History</button>
        
		<button onClick={revealWinners} style={{ display: hideElements ? 'none' : 'block', height:'35px',marginTop:'5px' }}>Reveal Winners</button>
		<button onClick={withdrawFunds} style={{ display: hideElements ? 'none' : 'block' , height:'35px',marginTop:'5px'}}>Withdraw Funds</button>
		<button onClick={restartLottery} style={{ display: hideElements ? 'none' : 'block' , height:'35px',marginTop:'5px' }}>Restart Lottery</button>
		<div className="container" style={{ display: 'flex'  }}>
		
		<input style={{ display: hideElements ? 'none' : 'block' }}
        type="text"
        placeholder="New Owner Address"
        onChange={(e) => transferOwnership(e.target.value)}
      />
      <button onClick={() => transferOwnership()} style={{ display: hideElements ? 'none' : 'block' }}>Transfer Ownership</button>
      <button onClick={selfDestruct} style={{ display: hideElements ? 'none' : 'block' }}>Self-Destruct Contract</button>
	  </div>
    <div>
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
	</div>
  );
};
export default App;