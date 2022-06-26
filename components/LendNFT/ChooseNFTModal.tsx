import { Alert, Box, Button, CircularProgress, Dialog, DialogTitle, Divider, Grid, IconButton, Stack, Step, StepButton, StepContent, StepLabel, Stepper, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import CloseIcon from '@mui/icons-material/Close';
import { erc721ABI, useAccount, useContract, useNetwork, useSigner } from 'wagmi'
import { ROPSTEN_MARKET, ROPSTEN_MARKET_ABI, Ropsten_WrapNFT, Ropsten_WrapNFT_ABI } from '../../constants/contractABI'
import NFTCard from '../IntegrationCard/NFTCard'
import styles from './style.module.scss'
import LoadingButton from '@mui/lab/LoadingButton';
import SendIcon from '@mui/icons-material/Send';
import PageviewIcon from '@mui/icons-material/Pageview';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import { useAlchemyService } from '../../hooks';
import { web3GetNFTS } from '../../services/web3NFT';

interface ChooseNFTModalProps {
  trigger: React.ReactElement
  gameName: string
  gameNFTCollection: string
}

const formatNFTdata = (nftList: any[]) => {
  return nftList.map((item) => ({
    nftName: item.title,
    nftImage: item.media?.[0]?.gateway || 'https://tva1.sinaimg.cn/large/e6c9d24egy1h3esgombq6j20m80m83yv.jpg',
    nftNumber: parseInt(item.id.tokenId),
  }))
}

const ChooseNFTModal: React.FC<ChooseNFTModalProps> = (props) => {
  const { trigger, gameName, gameNFTCollection } = props
  const [visibile, setVisibile] = useState<boolean>(false)

  const [selectedNFT, setSelectedNFT] = useState<string>('')
  const [isRequestingNFT, setIsRequestingNFT] = useState<boolean>(false)
  const { activeChain } = useNetwork()
  const { data: account } = useAccount()
  const { data: signer } = useSigner()
  const [NFTList, setNFTList] = useState<any[]>([])

  const [isChooseNFT, setIsChooseNFT] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [activeStep, setActiveStep] = useState<number>(0)
  const [stepComplete, setStepComplete] = useState<{ [k: number]: boolean }>({})

  // const Web3 = useAlchemyService()

  const contract721 = useContract({
    addressOrName: gameNFTCollection,
    contractInterface: erc721ABI,
    signerOrProvider: signer
  })

  const contractWrap = useContract({
    addressOrName: Ropsten_WrapNFT,
    contractInterface: Ropsten_WrapNFT_ABI,
    signerOrProvider: signer
  })

  const contractMarket = useContract({
    addressOrName: ROPSTEN_MARKET,
    contractInterface: ROPSTEN_MARKET_ABI,
    signerOrProvider: signer
  })


  useEffect(() => {
    (async () => {
      if (!account) {
        setNFTList([])
      } else {
        setIsRequestingNFT(true)
        // https://docs.alchemy.com/alchemy/enhanced-apis/nft-api/getnfts
        // const nft = await Web3.alchemy.getNfts({
        //   owner: account?.address || '',
        //   contractAddresses: [gameNFTCollection]
        // })
        const nft = await web3GetNFTS({
          owner: account?.address || '',
          contractAddresses: [gameNFTCollection]
        })
        setNFTList(formatNFTdata(nft.ownedNfts))
        setIsRequestingNFT(false)
      }
    })();
  }, [account])

  useEffect(() => {
    // 判断当前选中 NFT 之前是否已经被授权
    if (isChooseNFT) return

    (async () => {
      try {
        const approvedList = await contract721.getApproved(parseInt(selectedNFT))
        if (approvedList === Ropsten_WrapNFT) {
          setStepComplete({ ...stepComplete, [0]: true })
          setActiveStep(1)
        }
        console.log(approvedList)
      } catch (err) {
        console.log(err)
      }
    })()
  }, [isChooseNFT, visibile])


  const handleApproveErc721 = async () => {
    setErrorMessage('')
    if (isLoading) return
    setIsLoading(true)

    try {
      await contract721.approve(Ropsten_WrapNFT, parseInt(selectedNFT))
      setStepComplete({ ...stepComplete, [activeStep]: true })
      setActiveStep(activeStep + 1)
    } catch (err: any) {
      setErrorMessage(err?.message)
    }
    setIsLoading(false)
  }

  const handleStakeNFT = async () => {
    setErrorMessage('')
    if (isLoading) return
    setIsLoading(true)

    try {
      await contractWrap.stake(parseInt(selectedNFT))
      setStepComplete({ ...stepComplete, [activeStep]: true })
      setActiveStep(activeStep + 1)
    } catch (err: any) {
      setErrorMessage(err.message)
    }
    setIsLoading(false)
  }

  const handleApproveWrapNFT = async () => {
    setErrorMessage('')
    if (isLoading) return
    setIsLoading(true)

    try {
      await contractWrap.approve(Ropsten_WrapNFT, parseInt(selectedNFT))
      setStepComplete({ ...stepComplete, [activeStep]: true })
      setActiveStep(activeStep + 1)
    } catch (err: any) {
      setErrorMessage(err.message)
    }
    setIsLoading(false)
  }

  const handleListToMarket = async () => {
    setErrorMessage('')
    if (isLoading) return
    setIsLoading(true)

    try {
      const result = await contractMarket.createSkunInfo(parseInt(selectedNFT), Ropsten_WrapNFT)
      console.log(result)
      setStepComplete({ ...stepComplete, [activeStep]: true })
      setActiveStep(activeStep + 1)
    } catch (err: any) {
      console.log(err.message)
    }
    setIsLoading(false)
  }

  const createOrder = async () => {
    const result = await contractMarket.createOrder(104)
    console.log(result)
  }
  const setAccountAddress = async () => {
    await contractMarket.setAccountAddress("0x0ceEb819d1CBc5af87C65BFbE7b1eED01172A3EA")
  }

  const setProtocolAddress = async () => {
    await contractMarket.setProtocolAddress("0xE5725031D088f4Dd13056FDbd5A823FD4EDfEFcD")
  }

  const createSkunInfo = async () => {
    await contractMarket.createSkunInfo(104, Ropsten_WrapNFT)
  }


  const handleStepClick = (index: number) => {
    if (stepComplete[index] || stepComplete[index - 1]) {
      setActiveStep(index)
    }
  }

  const handleConfirmChoose = () => {
    if (!selectedNFT) return
    setIsChooseNFT(false)
  }

  return <React.Fragment>
    <Box onClick={() => { setVisibile(true) }} >
      {trigger}
    </Box>
    <Dialog open={visibile} className={styles.container} key="Choose NFT to deposit" >
      <DialogTitle className={styles.dialogTitle} sx={{ width: 'auto' }}>
        Choose NFT to deposit
        <IconButton
          aria-label="close"
          onClick={() => setVisibile(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: "2rem",
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <div className={styles.dialogContent}>
        {isChooseNFT && <Box maxWidth="95rem" minWidth="65rem" minHeight="36rem">
          {/* <Button onClick={createOrder}>createOrder</Button> */}
          {/* <Button onClick={setAccountAddress}>setAccountAddress</Button> */}
          {/* <Button onClick={setProtocolAddress}>setProtocolAddress</Button> */}
          {/* <Button onClick={createSkunInfo}>createSkunInfo</Button>  */}

          {/*  TODO: 判断当前链环节，申请切换至正确链 */}
          <Grid
            container
            rowSpacing="2.67rem"
            columnSpacing="2.5rem"
            sx={{ p: '3.33rem', maxHeight: '46.66rem', overflowY: 'scroll' }} >
            <Grid item xs={12}>
              <Typography variant="h3" sx={{ fontSize: '2rem', lineHeight: '2.67rem' }} >{gameName}</Typography>
            </Grid>
            {
              !isRequestingNFT && NFTList && NFTList.map((item, index) => <Grid key={index} item xs="auto">
                <NFTCard {...item} selectedNFT={selectedNFT} setSelectedNFT={setSelectedNFT} />
              </Grid>)
            }
            {
              isRequestingNFT && <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
                <CircularProgress sx={{ mt: '4rem', textAlign: 'center', }} />
              </Grid>
            }
            {
              !isRequestingNFT && NFTList.length === 0 && <Stack sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: 'auto' }}>
                <PageviewIcon sx={{ fontSize: '8rem', mt: "6rem" }} />
                <Typography sx={{ opacity: 0.8, textAlign: 'center', margin: '1rem auto' }}>
                  No {gameName} NFT found in current wallet address
                </Typography>
              </Stack>
            }
          </Grid>
        </Box>}

        {isChooseNFT && <Box>
          {selectedNFT && <Typography className={styles.selectedMessage}>#{selectedNFT} have been selected</Typography>}
          <Stack direction="row" justifyContent="center" spacing="3.33rem" mb="1.33rem" mt="1.33rem">
            <Box className={styles.defaultButton} onClick={() => setVisibile(false)}>Back  Game</Box>
            <Box className={`${styles.primaryButton} ${!selectedNFT ? styles.primaryButton_disable : null}`} onClick={handleConfirmChoose}>Confirm</Box>
          </Stack>
        </Box>}

        {
          !isChooseNFT && <Box className={styles.lendStep} width="65rem" minHeight="40rem">
            <Box className={styles.lendStepTitle}>
              <Button startIcon={<ChevronLeftIcon />} onClick={() => setIsChooseNFT(true)}>Back</Button>
              <Typography>Current Lending NFT #{selectedNFT} to Market</Typography>
            </Box>
            <Divider sx={{ mb: '2.5rem' }} />
            {errorMessage && <Alert variant="outlined" severity="error">{errorMessage}</Alert>}
            <Stepper
              orientation="vertical"
              activeStep={activeStep}
              nonLinear
            >
              <Step key="Approve 721 NFT" completed={stepComplete[0]}>
                <StepButton onClick={() => handleStepClick(0)}>
                  <StepLabel >
                    Approve Your Game ERC721 NFT
                  </StepLabel>
                </StepButton>

                <StepContent>
                  {!stepComplete[0] ? <LoadingButton
                    loading={isLoading}
                    variant="contained"
                    onClick={handleApproveErc721}
                  >
                    Approve
                  </LoadingButton> :
                    <>
                      <Button color='success'>🎉 &nbsp;Approved</Button>
                      <IconButton onClick={() => setActiveStep(activeStep + 1)}><NavigateNextIcon sx={{ transform: 'rotate(90deg)', opacity: '0.8' }} /></IconButton>
                    </>
                  }
                </StepContent>
              </Step>
              <Step key="Stake ERC721 NFT & Receive WrapNFT" completed={stepComplete[1]}>
                <StepButton onClick={() => handleStepClick(1)}>
                  <StepLabel >
                    Stake ERC721 NFT & Receive Your WrapNFT
                  </StepLabel>
                </StepButton>

                <StepContent>
                  <Typography>Stake your game NFT and receive a new WrapNFT, WrapNFT is to withdraw the credentials of your original NFT, don&#39;t lose it!</Typography>
                  {
                    !stepComplete[1] ?
                      <LoadingButton
                        loading={isLoading}
                        variant="contained"
                        onClick={handleStakeNFT}
                        endIcon={<SendIcon />}
                        loadingPosition="end"
                        sx={{ mt: '1rem' }}
                      >
                        Stake
                      </LoadingButton>
                      : <>
                        <Button color='success'>🎉 &nbsp;Staked</Button>
                        <IconButton onClick={() => setActiveStep(activeStep + 1)}><NavigateNextIcon sx={{ transform: 'rotate(90deg)', opacity: '0.8' }} /></IconButton>
                      </>
                  }
                </StepContent>
              </Step>
              <Step key="Approve WrapNFT" completed={stepComplete[2]}>
                <StepButton onClick={() => handleStepClick(2)}>
                  <StepLabel>
                    Approve WrapNFT
                  </StepLabel>
                </StepButton>

                <StepContent >
                  {
                    !stepComplete[2] ? <LoadingButton
                      loading={isLoading}
                      variant="contained"
                      onClick={handleApproveWrapNFT}
                    >
                      Approve
                    </LoadingButton> : <>
                      <Button color='success'>🎉 &nbsp;Staked</Button>
                      <IconButton onClick={() => setActiveStep(activeStep + 1)}><NavigateNextIcon sx={{ transform: 'rotate(90deg)', opacity: '0.8' }} /></IconButton>
                    </>
                  }

                </StepContent>
              </Step>
              <Step key="ListToMarket" completed={stepComplete[3]}>
                <StepButton onClick={() => handleStepClick(3)}>
                  <StepLabel>
                    List To Market
                  </StepLabel>
                </StepButton>
                <StepContent >
                  <LoadingButton
                    loading={isLoading}
                    variant="contained"
                    onClick={handleListToMarket}
                  >
                    List
                  </LoadingButton>
                </StepContent>
              </Step>
            </Stepper>

            {stepComplete[3] && <Box sx={{ mt: '3rem' }}>
              <Typography variant='h3' sx={{ fontSize: '2.5rem', textAlign: 'center' }}>🎉 Successful Lend Your NFT 🎉</Typography>
              <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: '1rem', fontSize: '1.5rem' }}>Your Lend NFT Will List In Market In Minutes</Typography>
            </Box>}

          </Box>
        }
      </div>
    </Dialog>
  </React.Fragment >

}

export default ChooseNFTModal