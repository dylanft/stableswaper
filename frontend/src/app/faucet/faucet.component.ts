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
  createLPString,
  PostConditionMode,
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
  tokenList: any[] = ['USDA', 'xUSD'];
  tokenChoice: string = '';
  tokenChoiceContract: any;
  tokenChoiceContractName: string = '';
  mintAmount: number = 0;
  deployerAddress: string = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  loggedInAsAdmin: boolean = false;

  network: any = new StacksMocknet();
  usdaContract: ContractPrincipalCV = contractPrincipalCVFromAddress(
      createAddress(this.deployerAddress),
      createLPString('usda-token')
    );

  xusdContract: ContractPrincipalCV = contractPrincipalCVFromAddress(
    createAddress(this.deployerAddress),
    createLPString('xusd-token')
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
      contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      contractName: 'stableswap-v2',
      functionName: 'swap-x-for-y',
      functionArgs: [tX, tY, uintCV(x), uintCV(y)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://localhost:8000/txid/${data.txId}?chain=testnet`,
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
    else {
      this.tokenChoiceContract = this.xusdContract;
      this.tokenChoiceContractName = 'xusd-token';
    }
    console.log("tokenChoice: ", this.tokenChoice);
    console.log("tokenChoiceContract", this.tokenChoiceContract);
    console.log("tokenChoiceContract", this.tokenChoiceContract.toString());

  }

  mintTokens() {
    console.log("minting ", this.mintAmount, " of ", this.tokenChoice);
    console.log(userSession.loadUserData().profile.stxAddress.testnet);
    var txSenderAddress: string;
    if (this.network.isMainnet()) {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.mainnet;
      console.log(txSenderAddress)
    }
    else {
      txSenderAddress = userSession.loadUserData().profile.stxAddress.testnet;
    }

    openContractCall({
      network: this.network,
      anchorMode: AnchorMode.Any,
      contractAddress: this.deployerAddress,
      // contractName: this.tokenChoiceContract.contractName.content,
      contractName: this.tokenChoiceContractName,
      functionName: 'mint',
      functionArgs: [uintCV(this.mintAmount), principalCV(txSenderAddress)],
      postConditionMode: PostConditionMode.Deny,
      postConditions: [],
      onFinish: (data) => {
        console.log('onFinish:', data);
        window
          ?.open(
            `http://localhost:8000/txid/${data.txId}?chain=testnet`,
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
    this.mintAmount = parseInt(val)*1000000;

  }
}
