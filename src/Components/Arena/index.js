import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import myEpicGame from '../../utils/MyEpicGame.json';
import './Arena.css';
import LoadingIndicator from '../LoadingIndicator';

// フロントエンドにNFTキャラクターを表示するため、characterNFTのメタデータを渡します。
const Arena = ({ characterNFT, setCharacterNFT }) => {
  // コントラクトのデータを保有する状態変数を初期化します。
  const [gameContract, setGameContract] = useState(null);
  const [boss, setBoss] = useState(null);
  const [attackState, setAttackState] = useState('');
  const [helpState, setHelpState] = useState('');
  const [showToask, setShowToask] = useState('');
  const [newAllyName, setNewAllyName] = useState('');
  const [newAllyAttackDamage, setNewAllyAttackDamage] = useState(null)


  const runAttackAction = async () => {
      try {
        if (gameContract) {
            setAttackState('attacking');
            console.log('Attacking boss...');

            const attackTxn = await gameContract.attackBoss();

            await attackTxn.wait();
            console.log('attackTxn:', attackTxn);

            setAttackState('hit');

            setShowToask('attack');
            setTimeout(() => {
                setShowToask('');
            }, 5000);

        }
      } catch (error) {
          console.error('Error attacking boss:', error);
          setAttackState('');
      }
  };

  const runHelpAction = async () => {
    try {
        setAttackState('helping');

        if (gameContract) {
            const attackTxn = await gameContract.allyAttackBoss();
            await attackTxn.wait();

            console.log('attackTxn:', attackTxn);
        setAttackState('');

        setShowToask('help');
        setTimeout(() => {
            setShowToask('');
        }, 5000);


      }
    } catch (error) {
        console.error('Error attacking boss:', error);
    }
    setAttackState('');
};


  useEffect(() => {
      const fetchBoss = async() => {
          const bossTxn = await gameContract.getBigBoss();
          console.log('Boss:', bossTxn);
          setBoss(transformCharacterData(bossTxn));
      };
      if (gameContract) {
          fetchBoss();
      }

      const onAttackComplete = (newBossHp, newPlayerHp) => {
          const bossHp = newBossHp.toNumber();
          const playerHp = newPlayerHp.toNumber();
          console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);

          setBoss((prevState) => {
              return { ...prevState, hp: bossHp };
          });
          setCharacterNFT((prevState) => {
              return { ...prevState, hp: playerHp };
          });
      };
      const onAllyAttackComplete = (newBossHp, newPlayerHp, allyName, allyAttackDamage) => {
        const bossHp = newBossHp.toNumber();
        const playerHp = newPlayerHp.toNumber();
        setNewAllyName(allyName);
        console.log('new ally name: ', newAllyName);
        setNewAllyAttackDamage(allyAttackDamage.toNumber());
        console.log('new ally attack damage: ', newAllyAttackDamage);

        console.log(`AttackComplete: Boss Hp: ${bossHp} Player Hp: ${playerHp}`);

        setBoss((prevState) => {
            return { ...prevState, hp: bossHp };
        });
    };

      if (gameContract) {
          fetchBoss();
          gameContract.on('AttackComplete', onAttackComplete);
          gameContract.on('AllyAttackComplete', onAllyAttackComplete);
      };

      return () => {
          if (gameContract) {
              gameContract.off('AttackComplete', onAttackComplete);
              gameContract.off('AllyAttackComplete', onAllyAttackComplete);
          }
      }
  }
  , [gameContract]);

  // ページがロードされると下記が実行されます。
  useEffect(() => {
    const { ethereum } = window;
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum);
      const signer = provider.getSigner();
      const gameContract = new ethers.Contract(
        CONTRACT_ADDRESS,
        myEpicGame.abi,
        signer
      );
      setGameContract(gameContract);
    } else {
      console.log('Ethereum object not found');
    }
  }, []);

  const renderMessage = () => {
      if (showToask === 'attack') {
        return <div id="desc">{`💥 ${boss.name} was hit for ${characterNFT.attackDamage}!`}</div>
      }
      else if(showToask === 'help') {
        return (
        <div id="desc">{`💥 Ally was coming!`}</div>
        )
      }
  } 

  return (
    <div className="arena-container">
      {/* 攻撃ダメージの通知を追加します */}
      {boss && characterNFT && (
        <div id="toast" className={showToask}>
            {renderMessage()}
        </div>
      )}
      {/* ボスをレンダリングします */}
      {boss && (
        <div className="boss-container">
          <div className={`boss-content  ${attackState}`}>
            <h2>🔥 {boss.name} 🔥</h2>
            <div className="image-content">
              <img src={boss.imageURI} alt={`Boss ${boss.name}`} />
              <div className="health-bar">
                <progress value={boss.hp} max={boss.maxHp} />
                <p>{`${boss.hp} / ${boss.maxHp} HP`}</p>
              </div>
            </div>
          </div>
          <div className="attack-container">
            <button className="cta-button" onClick={runAttackAction}>
              {`💥 攻撃`}
            </button>
            <button className="cta-button" onClick={runHelpAction}>
              {`💪 仲間を呼ぶ `}
            </button>
          </div>
          {/* Attack ボタンの下にローディングマークを追加します*/}
          {attackState === 'attacking' && (
            <div className="loading-indicator">
              <LoadingIndicator />
              <p>Attacking ⚔️</p>
            </div>
          )}
        </div>
      )}
      {/* NFT キャラクター をレンダリングします*/}
      <div className='player-grid'>
      {characterNFT && (
        <div className="players-container">
          <div className="player-container">
            <h2>Your Character</h2>
            <div className={`player ${attackState}`}>
              <div className="image-content">
                <h2>{characterNFT.name}</h2>
                <img
                  src={characterNFT.imageURI}
                  alt={`Character ${characterNFT.name}`}
                />
                <div className="health-bar">
                  <progress value={characterNFT.hp} max={characterNFT.maxHp} />
                  <p>{`${characterNFT.hp} / ${characterNFT.maxHp} HP`}</p>
                </div>
              </div>
              <div className="stats">
                <h4>{`⚔️ Attack Damage: ${characterNFT.attackDamage}`}</h4>
              </div>
            </div>
          </div>
          {/* <div className="active-players">
            <h2>Active Players</h2>
            <div className="players-list">{renderActivePlayersList()}</div>
          </div> */}
        </div>
      )}
    {newAllyName !== '' && (
        <div className="players-container">
          <div className="player-container">
            <h2>Ally Character</h2>
            <div className={`ally ${attackState}`}>
              <div className="image-content">
                <h2>{newAllyName}</h2>
                <img
                  src={`${process.env.PUBLIC_URL}/pokemon/${newAllyName}.png`}
                  alt={`Character ${newAllyName}`}
                />
                <div className="health-bar">
                </div>
              </div>
              <div className="stats">
                <h4>{`⚔️ Attack Damage: ${newAllyAttackDamage}`}</h4>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
    </div>
  );
};
export default Arena;