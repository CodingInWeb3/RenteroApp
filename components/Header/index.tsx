// @ts-nocheck
import styles from './index.module.scss'
import Image from 'next/image'
import Link from 'next/link'
import Logo from '../../public/header_logo.svg'
import ConnectWallet from '../ConnectWallet'
import { useIsMounted } from '../../hooks'
import { useAccount, useEnsAvatar, useEnsName, useDisconnect, useNetwork, chain, useContractWrite, erc20ABI, useProvider, useContract, useSigner, erc721ABI, useSignMessage, useSwitchNetwork } from 'wagmi'
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { formatAddress } from '../../utils/format'
import { Avatar, Chip, ClickAwayListener, Menu, MenuItem, MenuList, Slide, Snackbar, Typography, Box, Button } from '@mui/material'
import { useEffect, useMemo, useRef, useState } from 'react'
import { TransitionProps } from '@mui/material/transitions'
import { useRouter } from 'next/router'
import { utils } from 'ethers'
import { CHAIN_ICON, SUPPORT_CHAINS } from '../../constants'
import { Ropsten_721_AXE_NFT_ABI, Ropsten_721_AXE_NFT } from '../../constants/contractABI'
import { UserLoginParams } from '../../types/service'
import { userLogin } from '../../services/dashboard'
import { useLocalStorageState } from 'ahooks'
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export default function Header() {
  const router = useRouter()
  const isMounted = useIsMounted()
  const [jwtToken, setJwtToken] = useLocalStorageState<string>('token', {
    defaultValue: ''
  })
  const { address, isConnected } = useAccount()

  useEffect(() => {
    const [recordAddress] = jwtToken.split('*')
    if (address !== recordAddress && router.pathname === '/dashboard') {
      setTimeout(signMessage, 2000)
    }
  }, [address])

  const { chain } = useNetwork()
  const { pendingChainId, switchNetwork } = useSwitchNetwork()

  const { signMessage } = useSignMessage({
    message: 'Login Rentero',
    onSuccess: async (data) => {
      const params: UserLoginParams = {
        signature: data,
        timestamp: new Date().getTime(),
        userAddress: address
      }
      const result = await userLogin(params)
      // 存储 jwt token
      setJwtToken(`${address}*${result.data.authToken}`)
      router.push('/dashboard')
    }
  })

  const isEth = useMemo(() => {
    if (chain && chain.id === 1) {
      return true
    }
    return false
  }, [chain])

  const { data: ensAvatar } = useEnsAvatar({ addressOrName: address, enabled: isEth })
  const { data: ensName } = useEnsName({ address: address, enabled: isEth })
  const { disconnect } = useDisconnect()

  const [openSetting, setOpenSetting] = useState<boolean>(false)
  const anchorRef = useRef<HTMLElement>(null)
  const networkListAnchorRef = useRef<HTMLElement>(null)
  const [networkListOpen, setNetworkListOpen] = useState<boolean>(false)

  const [showAlertMessage, setShowAlertMessage] = useState<boolean>(false)

  // const provider = useProvider()
  const { data: signer } = useSigner()

  const contract = useContract({
    addressOrName: Ropsten_721_AXE_NFT,
    contractInterface: Ropsten_721_AXE_NFT_ABI,
    signerOrProvider: signer
  })

  const mint721 = async () => {
    try {
      await contract.mint()
    } catch (err: any) {
      console.log(err.message)
    }
  }
  // const updateURI = async () => {
  //   try {
  //     await contract.setBaseURI("ipfs://QmaV3ixoANZQcgTNnTFnXDtVR7wgBKQq7wX4JSrpYmkmer/")
  //   } catch (err: any) {
  //     console.log(err.message)
  //   }
  // }

  const transfer721 = async () => {
    try {
      await contract.transferFrom(address, '0x66567071D55A9FBE6B3944172592961c1C414075', 3)
    } catch (err: any) {
      console.log(err.message)

    }
  }

  const handleClose = (event: Event | React.SyntheticEvent) => {
    if (
      anchorRef.current &&
      anchorRef.current.contains(event.target as HTMLElement)
    ) {
      return;
    }

    setOpenSetting(false);
  }

  const handleEnterDashboard = (event: Event | React.SyntheticEvent) => {
    handleClose(event)
    if (!jwtToken) {
      signMessage()
    } else {
      const [recordAddress] = jwtToken.split('*')
      if (recordAddress !== address) {
        signMessage()
      }
    }
    router.push('/dashboard')
  }

  const handleLogout = (event: Event | React.SyntheticEvent) => {
    disconnect()
    handleClose(event)
  }

  const handleLinkToSupport = (event: Event) => {
    event.preventDefault()
    setShowAlertMessage(true)
  }

  const chooseSwitchNetwork = (id) => {
    setNetworkListOpen(false)
    if ((chain?.id !== id || pendingChainId !== id)) {
      switchNetwork(id)
    }
  }

  return <header className={styles.header}>
    <div className={styles.logo}>
      <a href='https://rentero.io' rel='noreferrer'>
        <img src='/header_logo.svg' alt='Rentero Logo' />
      </a>
    </div>
    <nav className={styles.navList}>
      <Link href="/"  >
        <a className={router.pathname === '/' || ['/detail'].some(item => item.indexOf(router.pathname) === 0) ? styles.activeNavItem : undefined}>Market</a></Link>
      <Link href="/lend">
        <a className={router.pathname === '/lend' ? styles.activeNavItem : undefined}>Lend NFTs</a>
      </Link>
      <a className={styles.supportNav}>Support</a>
      <Snackbar
        open={showAlertMessage}
        message="WIP: Coming soon！"
        autoHideDuration={3000}
        onClose={() => setShowAlertMessage(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        TransitionComponent={(props: TransitionProps) => <Slide {...props} direction="right" />}
      />
    </nav>
    {/* <button onClick={updateURI}>updateURI</button> */}
    {/* <button onClick={mint721}>Click</button> */}
    {/* <button onClick={transfer721}>Transfer</button> */}
    {(isMounted && isConnected) &&
      <Chip
        avatar={<Avatar alt={chain?.name} className={styles.networkIcon} src={CHAIN_ICON[chain?.id || 1]} />}
        label={chain?.name || "Ethereum"}
        className={styles.networkList}
        ref={networkListAnchorRef}
        onDelete={() => setNetworkListOpen(true)}
        deleteIcon={<KeyboardArrowDownOutlinedIcon className={styles.downIcon} />}
        onClick={() => setNetworkListOpen(true)}
      />}
    <Menu
      anchorEl={networkListAnchorRef.current}
      open={networkListOpen}
      onClose={() => setNetworkListOpen(false)}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      sx={{ width: '200px' }}
    >
      <MenuItem disabled>
        <Typography className={styles.networkListTitle}>Switch Network</Typography>
      </MenuItem>
      {
        SUPPORT_CHAINS.map(item => {
          return <MenuItem key={item.id} onClick={() => chooseSwitchNetwork(item.id)} className={styles.networkListItem}>
            <Avatar src={CHAIN_ICON[item.id]} alt={item.name} sx={{ width: '20px', height: '20px', marginRight: '0.8rem' }} />
            <span>{item.name}</span>
            {chain && <Box className={item.id === chain.id && styles.currentNetwork}></Box>}
          </MenuItem>
        })
      }
    </Menu>

    {(isMounted && isConnected) ?
      <Chip
        avatar={<AccountBalanceWalletIcon />}
        label={<div className={styles.addressOrEns}>
          {ensName ? ensName : formatAddress(address, 4)}
          <KeyboardArrowDownOutlinedIcon className={styles.downIcon} />
        </div>}
        className={styles.accountBox}
        onClick={() => setOpenSetting(true)}
        ref={anchorRef}
      /> : <ConnectWallet
        trigger={<span className={styles.connectButton}>Connect Wallet</span>}
      />
    }
    <ClickAwayListener onClickAway={handleClose}>
      <Menu
        open={openSetting}
        anchorEl={anchorRef.current}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <MenuItem onClick={handleEnterDashboard}>
          <DashboardIcon />
          <span className={styles.menuText}>Dashboard</span>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon />
          <span className={styles.menuText}>Disconnect</span>
        </MenuItem>
      </Menu>
    </ClickAwayListener>
  </header >
}