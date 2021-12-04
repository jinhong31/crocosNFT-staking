import React from "react";
import { useState, useEffect } from 'react'
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import { ethers } from 'ethers'
import Web3 from 'web3'
import Web3Modal from "web3modal";
import { getImg } from "../../hook/Helper";
import styles from './Home.module.sass';
import axios from 'axios'
import { CustomButton } from "../../components/CustomButton";
import CrocosFarmCont from "../../ABI/CrocosFarm.json";
import CrocosNFTCont from "../../ABI/CrocosNFT.json";
const CrocosFarmAddr = "0xdBb9E4A73fe40B31b78D8D361516d59Be31Ed3Bd";
const CrocosNFTAddr = "0x91465FF2aA45DC4667BD895c12cA44C089858A70";
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

export const CardObj = () => {

    const [open, setOpen] = useState(false);
    const [tokensOfOwner, setTokensOfOwner] = useState([]);
    const [stakeState, setStakeState] = useState(false);
    const [harvest, setHarvest] = useState(0);
    const [selectedNFT, setSelectedNFT] = useState([])

    const StandardImageList = (props) => {
        const clickHandler = (e) => {
            if (selectedNFT.includes(e)) setSelectedNFT(selectedNFT.filter(item => item !== e))
            else setSelectedNFT([...selectedNFT, e])
        }

        return (
            <ImageList sx={{ width: 'auto', height: 450, padding: '50px' }} cols={4}>
                {props.itemData.map((item, key) => (
                    <div className={selectedNFT.includes(item.tokenId) ? styles.active : ""} key={key}>
                        <ImageListItem onClick={() => clickHandler(item.tokenId)} >
                            <div className={styles.image_card}>
                                <img
                                    src={item.img}
                                    alt={item.title}
                                    loading="lazy"
                                />
                                <ImageListItemBar
                                    title={item.title}
                                    position="below"
                                />
                            </div>
                        </ImageListItem>
                    </div>
                ))}
            </ImageList>
        );
    }

    const onClickStake = async () => {

        for (let i = 0; i < selectedNFT.length; i++) {
            selectedNFT[i] = selectedNFT[i] - 0;
        }
        console.log(selectedNFT)
        if (selectedNFT.length > 0) {
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
                    farmContract = new ethers.Contract(
                        CrocosFarmAddr,
                        CrocosFarmCont.abi,
                        signer
                    );
                    nftContract = new ethers.Contract(
                        CrocosNFTAddr,
                        CrocosNFTCont.abi,
                        signer
                    );
                    if (stakeState === true) {
                        const nftCon = await nftContract.setApprovalForAll(CrocosFarmAddr, 1);
                        await nftCon.wait();
                        const farmCon = await farmContract.batchStake(selectedNFT);
                        await farmCon.wait();
                        setOpen(false)
                    } else {
                        const farmCon = await farmContract.batchWithdraw(selectedNFT);
                        await farmCon.wait();
                        setOpen(false)
                    }
                    setSelectedNFT([])
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
                // console.log(myAddr)
                farmContract = new ethers.Contract(
                    CrocosFarmAddr,
                    CrocosFarmCont.abi,
                    signer
                );
                if (chainId === 338) {

                    const reward = (await farmContract.getTotalClaimable(myAddr) / Math.pow(10, 18)).toString().slice(0, 6);
                    setHarvest(reward);

                } else {
                    try {
                        clearInterval(timer)
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
        }, 3000)
    }, [])

    const onClickPick = async () => {
        setStakeState(true);
        setSelectedNFT([]);
        const web3 = new Web3(Web3.givenProvider);
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
                nftContract = new ethers.Contract(
                    CrocosNFTAddr,
                    CrocosNFTCont.abi,
                    provider
                );
                // const balance = await nftContract.balanceOf(myAddr);
                const walletOfOwner = await nftContract.walletOfOwner(myAddr);
                const tokenData = [];
                for (var i = 0; i < walletOfOwner.length; i++) {
                    let tokenURI = await nftContract.tokenURI(walletOfOwner[i] - 0);
                    // tokenURI = tokenURI.slice(0, 82)
                    const nftMetaData = await axios.get(tokenURI);
                    console.log(nftMetaData)
                    const nftTokenData = { img: `https://ipfs.io/ipfs/${nftMetaData.data.image.slice(7)}`, title: nftMetaData.data.name, tokenId: walletOfOwner[i] }
                    tokenData.push(nftTokenData);
                }
                setTokensOfOwner(tokenData);
                console.log(tokenData)
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
                )
                if (harvest > 0) {
                    const farmCon = await farmContract.harvest();
                    await farmCon.wait();
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
        setSelectedNFT([])
        console.log(selectedNFT)
        const tokenData = [];
        console.log('clicked')
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
                nftContract = new ethers.Contract(
                    CrocosNFTAddr,
                    CrocosNFTCont.abi,
                    signer
                );
                const stakeOfOwner = await farmContract.stakeOfOwner(myAddr);
                console.log(stakeOfOwner)
                for (var i = 0; i < stakeOfOwner.length; i++) {
                    let tokenURI = await nftContract.tokenURI(stakeOfOwner[i]);
                    console.log(tokenURI);
                    const nftMetaData = await axios.get(tokenURI);
                    const nftTokenData = { img: `https://ipfs.io/ipfs/${nftMetaData.data.image.slice(7)}`, title: nftMetaData.data.name, tokenId: stakeOfOwner[i] }
                    tokenData.push(nftTokenData);
                }
                setTokensOfOwner(tokenData);
                console.log(tokenData)
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
                        <StandardImageList itemData={tokensOfOwner} stakeState={stakeState} />
                        <CustomButton value={setStakeState ? "Stake" : "Withdraw"} onClick={onClickStake} style={{ float: 'right', margin: '0 30px 20px', width: 150 }} />
                    </Box>
                </Fade>
            </Modal>
        </div>
    )
}