import { Component, OnInit } from '@angular/core';
import { openContractCall } from '@stacks/connect';
import { StacksMocknet, StacksTestnet } from '@stacks/network';
import {
  AnchorMode,
  ContractPrincipal,
  contractPrincipalCV,
  ContractPrincipalCV,
  callReadOnlyFunction,
  contractPrincipalCVFromAddress,
  createAddress,
  createAssetInfo,
  createLPString,
  FungibleConditionCode,
  intCV,
  makeStandardFungiblePostCondition,
  makeStandardSTXPostCondition,
  PostConditionMode,
  stringAsciiCV,
  stringUtf8CV,
  uintCV,
  cvToValue
} from '@stacks/transactions';
import { principalCV } from '@stacks/transactions/dist/clarity/types/principalCV';
import { userSession } from 'src/stacksUserSession';


@Component({
  selector: 'faucet',
  templateUrl: './faucet.component.html',
  styleUrls: ['./faucet.component.css']
})
export class FaucetComponent implements OnInit {

  constructor() { }
  ngOnInit(): void {
    if (this.userSession.loadUserData().profile.stxAddress.testnet == this.deployerAddress) {
      this.loggedInAsAdmin = true;
      console.log("loggedInAsAdmin: ", this.loggedInAsAdmin)
    }
    this.getUsersTokenBalance('USDA', 1e6).then((x) => this.usdaBalance = x);
    this.getUsersTokenBalance('xUSD', 1e6).then((x) => this.xusdBalance = x);
    this.getUsersTokenBalance('xBTC', 1).then((x) => this.xbtcBalance = x);
    this.getUsersTokenBalance('usd-lp', 1e6).then((x) => this.usdlpBalance = x);
    this.stxBalance = this.userSession.loadUserData().profile.stxBalance;
  }
  tokenList: any[] = ['USDA', 'xUSD', 'xBTC'];
  tokenChoice: string = '';
  tokenChoiceContract: any;
  tokenChoiceContractName: string = '';
  mintAmount: number = 0;
  deployerAddress: string = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW';
  loggedInAsAdmin: boolean = false;
  usdaBalance: string | null = null;
  xusdBalance: string | null = null;
  xbtcBalance: string | null = null;
  usdlpBalance: string | null = null;
  stxBalance: number = 0;

  network: any = new StacksTestnet();
  usdaContract: ContractPrincipalCV = contractPrincipalCVFromAddress(
      createAddress(this.deployerAddress),
      createLPString('usda-token')
    );

  xusdContract: ContractPrincipalCV = contractPrincipalCVFromAddress(
    createAddress(this.deployerAddress),
    createLPString('xusd-token')
  );

  xbtcContract: ContractPrincipalCV = contractPrincipalCVFromAddress(
    createAddress(this.deployerAddress),
    createLPString('xbtc-token')
  );


  public userSession = userSession;


  swapXforY(tokenX: string, tokenY: string, x: number, y: number) {
    if (tokenX == 'USDA' && tokenY=='xUSD') {
      var tX = this.usdaContract;
      var tY = this.xusdContract;
    }
    else if (tokenX == 'xUSD' && tokenY=='USDA') {
      var tX = this.xusdContract;
      var tY = this.usdaContract;
    }
    else {
      var tX = this.usdaContract;
      var tY = this.xusdContract;
    }
    openContractCall({
      network: this.network,
      anchorMode: AnchorMode.Any,
      contractAddress: 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW',
      contractName: 'stableswap-v3',
      functionName: 'swap-x-for-y',
      functionArgs: [tX, tY, uintCV(x), uintCV(y)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://explorer.stacks.co/txid/${data.txId}?chain=testnet`,
            '_blank'
          )
          ?.focus();
      },
      onCancel: () => {
        console.log('onCancel:', 'Transaction was canceled');
      },
    });
  }

  selectToken(event: any, tokenAorB: string) {
    // console.log("event: ", event)
    // console.log("event.value: ", event.value)
    // if (tokenAorB == "A") {
    //   this.tokenA = event.value;
    //   console.log("tokenA: ", this.tokenA);
    // }
    // else if (tokenAorB == "B") {
    //   this.tokenB = event.value;
    //   console.log("tokenB: ", this.tokenB);
    // }
    this.tokenChoice = event.value;
    if (this.tokenChoice == 'USDA') {
      this.tokenChoiceContract = this.usdaContract;
      this.tokenChoiceContractName = 'usda-token';
    }
    else if (this.tokenChoice == 'xUSD') {
      this.tokenChoiceContract = this.xusdContract;
      this.tokenChoiceContractName = 'xusd-token';
    }
    else {
      this.tokenChoiceContract = this.xbtcContract;
      this.tokenChoiceContractName = 'xbtc-token'
    }
    console.log("tokenChoice: ", this.tokenChoice);
    console.log("tokenChoiceContract", this.tokenChoiceContract);
    console.log("tokenChoiceContract", this.tokenChoiceContract.toString());

  }

  mintTokens() {
    var amount = this.mintAmount;
    var txSenderAddress: string;
    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    if (this.tokenChoice == 'USDA' || this.tokenChoice == 'xUSD') {
      amount = this.mintAmount * 1e6; // handles token decimals so user can input natural dollar amount
    }
    console.log("minting ", amount, " of ", this.tokenChoice);
    console.log(userSession.loadUserData().profile.stxAddress.testnet);

    openContractCall({
      network: this.network,
      anchorMode: AnchorMode.Any,
      contractAddress: this.deployerAddress,
      contractName: this.tokenChoiceContractName,
      functionName: 'mint',
      functionArgs: [uintCV(amount), principalCV(txSenderAddress)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://explorer.stacks.co/txid/${data.txId}?chain=testnet`,
            '_blank'
          )
          ?.focus();
      },
      onCancel: () => {
        console.log('onCancel:', 'Transaction was canceled');
      },
    });


  }

  setMintAmount(val: string) {
    console.log(val)
    this.mintAmount = parseInt(val);
  }

  createPool() {
    var tx_amt = 1000000*1e6;
    var ty_amt = 1000000*1e6;
    var txSenderAddress: string;
    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var createPoolPC1 = makeStandardFungiblePostCondition(
      txSenderAddress,
      FungibleConditionCode.Equal,
      tx_amt,
      createAssetInfo(this.deployerAddress, 'usda-token', 'usda')
    )

    var createPoolPC2 = makeStandardFungiblePostCondition(
      txSenderAddress,
      FungibleConditionCode.Equal,
      tx_amt,
      createAssetInfo(this.deployerAddress, 'xusd-token', 'xusd')
    )

    var tx = this.usdaContract;
    var ty = this.xusdContract;
    console.log("tx: ", tx)
    console.log("ty: ", ty)
    openContractCall({
      network: this.network,
      anchorMode: AnchorMode.Any,
      contractAddress: 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW',
      contractName: 'stableswap-v3',
      functionName: 'create-pair',
      functionArgs: [tx, ty, stringAsciiCV("usda-xusd"), uintCV(tx_amt), uintCV(ty_amt)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [createPoolPC1, createPoolPC2],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://explorer.stacks.co/txid/${data.txId}?chain=testnet`,
            '_blank'
          )
          ?.focus();
      },
      onCancel: () => {
        console.log('onCancel:', 'Transaction was canceled');
      },
    });
  }

  createPool2() {
    var tx_amt = 1000;
    var ty_amt = tx_amt;
    var txSenderAddress: string;
    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    var createPoolPC1 = makeStandardSTXPostCondition(
      txSenderAddress,
      FungibleConditionCode.Equal,
      tx_amt
    )

    var createPoolPC2 = makeStandardFungiblePostCondition(
      txSenderAddress,
      FungibleConditionCode.Equal,
      ty_amt,
      createAssetInfo('ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW', 'apples-r', 'apples-r')
    )

    // var tx = this.usdaContract;
    // var ty = this.xusdContract;
    // console.log("tx: ", tx)
    // console.log("ty: ", ty)
    openContractCall({
      network: this.network,
      anchorMode: AnchorMode.Any,
      contractAddress: 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW',
      contractName: 'apple-dex',
      functionName: 'provide-liquidity',
      functionArgs: [uintCV(tx_amt), uintCV(ty_amt)],
      postConditionMode: PostConditionMode.Allow,
      postConditions: [],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://explorer.stacks.co/txid/${data.txId}?chain=testnet`,
            '_blank'
          )
          ?.focus();
      },
      onCancel: () => {
        console.log('onCancel:', 'Transaction was canceled');
      },
    });
  }

  addToPool() {
    var tx = this.usdaContract;
    var ty = this.xusdContract;
    console.log("tx: ", tx)
    console.log("ty: ", ty)
    openContractCall({
      network: this.network,
      anchorMode: AnchorMode.Any,
      contractAddress: 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW',
      contractName: 'stableswap-v3',
      functionName: 'add-to-position',
      functionArgs: [tx, ty, uintCV(500000), uintCV(500000)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://explorer.stacks.co/txid/${data.txId}?chain=testnet`,
            '_blank'
          )
          ?.focus();
      },
      onCancel: () => {
        console.log('onCancel:', 'Transaction was canceled');
      },
    });
  }

  async getUsersTokenBalance(token: string, decimalFactor: number) {
    var txSenderAddress: string;

    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    if (token == 'USDA') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'
      var contractName = 'usda-token'
    } 
    else if (token == 'xUSD') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'
      var contractName = 'xusd-token'
    } 
    else if (token == 'xBTC') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'
      var contractName = 'xbtc-token'
    } 
    else if (token == 'usd-lp') {
      var contractAddress = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW'
      var contractName = 'usd-lp'
    } 
    else {
      var contractAddress = ''
      var contractName = ''
      console.log(token + " balance lookup not included with app code")
    } 
    
    var options = {
      network: this.network,
      contractAddress: contractAddress,
      contractName: contractName,
      functionName: 'get-balance',
      functionArgs: [principalCV(txSenderAddress)],
      senderAddress: txSenderAddress

    }
    const result = await callReadOnlyFunction(options);
    var output = cvToValue(result);
    return this.numberWithCommas(output.value, decimalFactor);

  }

  numberWithCommas(n: number, uintDecimalFactor: number) {
    var n_str = (n / uintDecimalFactor).toString();
    var x = Number(parseFloat(n_str)).toFixed(2);
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }
}
