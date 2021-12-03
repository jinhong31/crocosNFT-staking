import React from "react";
import { useState, useEffect } from 'react'
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import { ethers } from 'ethers'
import Web3 from 'web3'
import Web3Modal from "web3modal";
import { getImg } from "../../hook/Helper";
import styles from './Home.module.sass';
import { CustomButton } from "../../components/CustomButton";
import CrocosFarmCont from "../../ABI/CrocosFarm.json";
import CrocosTokenCont from '../../ABI/CrocosToken.json';
const CrocosFarmAddr = "0xdBb9E4A73fe40B31b78D8D361516d59Be31Ed3Bd";
const CrocosTokenAddr = "0x8e7487Bc8a2E5a1BF119C716DcDC5a7DD1d0C06f";
let myAddr = "";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: 'background.paper',
    border: '2px solid #000',
    boxShadow: 24,
};

export const CardNum = () => {
    const [open, setOpen] = useState(false);
    const [stakeState, setStakeState] = useState(false);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [stakeBalance, setStakeBalance] = useState(0);
    const [harvest, setHarvest] = useState(0);
    const [stakeWithBal, setStakeWithBal] = useState(0);
    const onClickStake = async () => {
        if (stakeWithBal && stakeWithBal > 0) {
            const web3 = new Web3(Web3.givenProvider);
            let farmContract;
            let tokenContract;
            try {
                const chainId = await web3.eth.getChainId()
                if (chainId === 338) {
                    const web3Modal = new Web3Modal();
                    const connection = await web3Modal.connect();
                    const provider = new ethers.providers.Web3Provider(connection);
                    const signer = provider.getSigner();
                    farmContract = new ethers.Contract(
                        CrocosFarmAddr,
                        CrocosFarmCont.abi,
                        signer
                    );
                    tokenContract = new ethers.Contract(
                        CrocosTokenAddr,
                        CrocosTokenCont.abi,
                        signer
                    );
                    if (stakeState === true) {
                        const tokenCon = await tokenContract.approve(CrocosFarmAddr, ('1000000000000000000000000'));
                        await tokenCon.wait();
                        const farmCon = await farmContract.stakeFt(`{stakeWithBal}00000000000000`);
                        await farmCon.wait();
                        setOpen(false)
                    } else {
                        const farmCon = await farmContract.withdrawFt(stakeWithBal * (10 ** 18));
                        await farmCon.wait();
                        setOpen(false)
                    }
                } else {
                    try {
                        await web3.currentProvider.request({
                            method: "wallet_switchEthereumChain",
                            params: [{ chainId: "0x152" }]
                        });
                    } catch (error) {
                        console.log(error.message);
                    }
                }
            } catch (err) {
                console.log(err)
            }
        }

    }
    useEffect(() => {

        const timer = setInterval(async () => {
            const web3 = new Web3(Web3.givenProvider);
            let farmContract;
            try {
                const chainId = await web3.eth.getChainId()
                const web3Modal = new Web3Modal();
                const connection = await web3Modal.connect();
                const provider = new ethers.providers.Web3Provider(connection);
                const signer = provider.getSigner();
                myAddr = signer.provider.provider.selectedAddress;
                farmContract = new ethers.Contract(
                    CrocosFarmAddr,
                    CrocosFarmCont.abi,
                    signer
                );
                if (chainId === 338) {
                    const reward = (await farmContract.getTotalClaimableFt(myAddr) / Math.pow(10, 18)).toString().slice(0, 6);
                    setHarvest(reward);

                } else {
                    clearInterval(timer)
                }
            } catch (err) {
                console.log(err)
            }
        }, 3000)
    }, [])

    const onClickPick = async () => {
        setStakeState(true);
        setStakeWithBal(0)
        const web3 = new Web3(Web3.givenProvider);
        let tokenContract;
        try {
            const chainId = await web3.eth.getChainId()
            if (chainId === 338) {
                const web3Modal = new Web3Modal();
                const connection = await web3Modal.connect();
                const provider = new ethers.providers.Web3Provider(connection);
                const signer = provider.getSigner();
                myAddr = signer.provider.provider.selectedAddress;
                console.log(myAddr)
                tokenContract = new ethers.Contract(
                    CrocosTokenAddr,
                    CrocosTokenCont.abi,
                    provider
                );
                // const balance = await nftContract.balanceOf(myAddr);
                const currentValue = await tokenContract.balanceOf(myAddr);
                setCurrentBalance(currentValue - 0)
                console.log(currentValue)
                setOpen(true)
            } else {
                try {
                    const switchChain = await web3.currentProvider.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: "0x152" }]
                    });
                    await switchChain.wait()
                } catch (error) {
                    console.log(error.message);
                }
            }
        } catch (err) {
            console.log(err)
        }

    }

    const onClickHarvest = async () => {
        console.log('clicked')
        const web3 = new Web3(Web3.givenProvider);
        let farmContract;
        try {
            const chainId = await web3.eth.getChainId()
            if (chainId === 338) {
                const web3Modal = new Web3Modal();
                const connection = await web3Modal.connect();
                const provider = new ethers.providers.Web3Provider(connection);
                const signer = provider.getSigner();
                myAddr = signer.provider.provider.selectedAddress;
                console.log(myAddr)
                farmContract = new ethers.Contract(
                    CrocosFarmAddr,
                    CrocosFarmCont.abi,
                    signer
                );
                if (harvest > 0) {
                    await farmContract.harvestFt();
                }
            } else {
                try {
                    await web3.currentProvider.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: "0x152" }]
                    });
                } catch (error) {
                    console.log(error.message);
                }
            }
        } catch (err) {
            console.log(err)
        }
    }

    const onClickWithdraw = async () => {
        setStakeState(false);
        setStakeWithBal(0);

        const web3 = new Web3(Web3.givenProvider);
        let farmContract;
        let nftContract;
        try {
            const chainId = await web3.eth.getChainId()
            if (chainId === 338) {
                const web3Modal = new Web3Modal();
                const connection = await web3Modal.connect();
                const provider = new ethers.providers.Web3Provider(connection);
                const signer = provider.getSigner();
                myAddr = signer.provider.provider.selectedAddress;
                console.log(myAddr)
                farmContract = new ethers.Contract(
                    CrocosFarmAddr,
                    CrocosFarmCont.abi,
                    signer
                );
                const val = await farmContract.stakeBalancesFt(myAddr);
                setStakeBalance(val);
                setOpen(true)
            } else {
                try {
                    await web3.currentProvider.request({
                        method: "wallet_switchEthereumChain",
                        params: [{ chainId: "0x152" }]
                    });
                } catch (error) {
                    console.log(error.message);
                }
            }
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div>
            <div className={styles.card}>
                <div className={styles.title}>Stake NFT get CROCOS</div>
                <img src={getImg('home/nft.png')} alt="nft" />
                <CustomButton value="Pick NFT" onClick={onClickPick} />
                <div className={styles.box}>
                    <h5>Reward</h5>
                    <p>{harvest} CROCOS</p>
                    <CustomButton value="Harvest" onClick={onClickHarvest} />
                </div>
                <CustomButton value="Withdraw" onClick={onClickWithdraw} />
            </div>
            <Modal
                open={open}
                onClose={() => setOpen(false)}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={open}>
                    <Box sx={style}>
                        <div className={styles.unmber}>
                            <h3>Balance {stakeState ? Math.trunc(currentBalance / (10 ** 13)) / 100000 : Math.trunc(stakeBalance / (10 ** 13)) / 100000}</h3>
                            <input type="number"
                                onChange={(e) => {
                                    setStakeWithBal(e.target.value)
                                    if (e.target.value < 0) e.target.value = 0
                                }} />
                        </div>
                        <CustomButton value={stakeState ? "Stake" : "Withdraw"} onClick={onClickStake} style={{ float: 'right', margin: '0 50px 20px 0', width: 150 }} />
                    </Box>
                </Fade>
            </Modal>
        </div>
    )
}