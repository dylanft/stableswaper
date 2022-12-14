import { Component, OnInit } from '@angular/core';
import { openContractCall } from '@stacks/connect';
import { StacksMocknet, StacksTestnet } from '@stacks/network';
import {
  AnchorMode,
  ContractPrincipal,
  contractPrincipalCV,
  ContractPrincipalCV,
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
  }
  tokenList: any[] = ['USDA', 'xUSD', 'xBTC'];
  tokenChoice: string = '';
  tokenChoiceContract: any;
  tokenChoiceContractName: string = '';
  mintAmount: number = 0;
  deployerAddress: string = 'ST38GBVK5HEJ0MBH4CRJ9HQEW86HX0H9AP3EJP4TW';
  loggedInAsAdmin: boolean = false;

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
}
