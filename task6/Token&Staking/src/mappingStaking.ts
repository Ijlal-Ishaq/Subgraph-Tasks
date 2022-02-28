import {
  BaseInterestUpdated as BaseInterestUpdatedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
  Paused as PausedEvent,
  StakeCompleted as StakeCompletedEvent,
  Unpaused as UnpausedEvent,
  Unstake as UnstakeEvent,
} from "../generated/DaoStakeContract/DaoStakeContract";
import {
  BaseInterestUpdated,
  OwnershipTransferred,
  Paused,
  StakeCompleted,
  Unpaused,
  Unstake,
  UserStaking,
  Transaction,
  ContractDetail,
} from "../generated/schema";

export function handleBaseInterestUpdated(
  event: BaseInterestUpdatedEvent
): void {
  let entity = new BaseInterestUpdated(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity._newRate = event.params._newRate;
  entity._oldRate = event.params._oldRate;
  entity.save();
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.previousOwner = event.params.previousOwner;
  entity.newOwner = event.params.newOwner;
  entity.save();
}

export function handlePaused(event: PausedEvent): void {
  let entity = new Paused(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.account = event.params.account;
  entity.save();
}

export function handleStakeCompleted(event: StakeCompletedEvent): void {
  let entity = new StakeCompleted(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.altQuantity = event.params.altQuantity;
  entity.initiationTimestamp = event.params.initiationTimestamp;
  entity.durationTimestamp = event.params.durationTimestamp;
  entity.rewardAmount = event.params.rewardAmount;
  entity.staker = event.params.staker;
  entity.phnxContractAddress = event.params.phnxContractAddress;
  entity.portalAddress = event.params.portalAddress;
  entity.save();

  let user = UserStaking.load(event.transaction.from.toHexString());
  let contractDetail = ContractDetail.load("1");

  if (!contractDetail) {
    contractDetail = new ContractDetail("1");
  }

  contractDetail.stakedAmount = contractDetail.stakedAmount.plus(
    event.params.altQuantity
  );
  contractDetail.totalRewardDistributed = contractDetail.totalRewardDistributed.plus(
    event.params.rewardAmount
  );

  if (!user) {
    user = new UserStaking(event.transaction.from.toHexString());
  }

  user.stakedAmount = user.stakedAmount.plus(event.params.altQuantity);

  let transaction = new Transaction(event.transaction.hash.toHexString());
  transaction.type = "stake";
  transaction.amount = event.params.altQuantity;
  transaction.timeStamp = event.block.timestamp;
  transaction.txHash = event.transaction.hash.toHexString();
  transaction.blockNo = event.block.number;
  transaction.user = user.id;

  contractDetail.save();
  transaction.save();
  user.save();
}

export function handleUnpaused(event: UnpausedEvent): void {
  let entity = new Unpaused(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.account = event.params.account;
  entity.save();
}

export function handleUnstake(event: UnstakeEvent): void {
  let entity = new Unstake(
    event.transaction.hash.toHex() + "-" + event.logIndex.toString()
  );
  entity.staker = event.params.staker;
  entity.stakedToken = event.params.stakedToken;
  entity.portalAddress = event.params.portalAddress;
  entity.altQuantity = event.params.altQuantity;
  entity.durationTimestamp = event.params.durationTimestamp;
  entity.save();

  let contractDetail = ContractDetail.load("1");

  if (!contractDetail) {
    contractDetail = new ContractDetail("1");
  }

  contractDetail.stakedAmount = contractDetail.stakedAmount.minus(
    event.params.altQuantity
  );

  let user = UserStaking.load(event.transaction.from.toHexString());

  if (!user) {
    user = new UserStaking(event.transaction.from.toHexString());
  }

  user.stakedAmount = user.stakedAmount.minus(event.params.altQuantity);

  let transaction = new Transaction(event.transaction.hash.toHexString());
  transaction.type = "unstake";
  transaction.amount = event.params.altQuantity;
  transaction.timeStamp = event.block.timestamp;
  transaction.txHash = event.transaction.hash.toHexString();
  transaction.blockNo = event.block.number;
  transaction.user = user.id;

  contractDetail.save();
  transaction.save();
  user.save();
}
