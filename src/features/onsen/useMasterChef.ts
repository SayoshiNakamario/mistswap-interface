import { useActiveWeb3React, useSushiContract } from '../../hooks'

import { BigNumber } from '@ethersproject/bignumber'
import { Chef } from './enum'
import { Zero } from '@ethersproject/constants'
import { useCallback } from 'react'
import { useChefContract } from './hooks'
import { getGasPrice } from '../../functions/trade'
import Web3Connect from '../../components/Web3Connect'

export default function useMasterChef(chef: Chef) {
  const { account } = useActiveWeb3React()

  const sushi = useSushiContract()

  const contract = useChefContract(chef)

  // Deposit
  const deposit = useCallback(
    async (pid: number, amount: BigNumber) => {
      try {
        let tx

        if (chef === Chef.MASTERCHEF) {
          tx = await contract?.deposit(pid, amount, {
            gasPrice: getGasPrice(),
            gasLimit: 300000,
          })
        } else {
          tx = await contract?.deposit(pid, amount, account, {
            gasPrice: getGasPrice(),
            gasLimit: 300000,
          })
        }

        return tx
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [account, chef, contract]
  )

  // Withdraw
  const withdraw = useCallback(
    async (pid: number, amount: BigNumber) => {
      try {
        let tx

        if (chef === Chef.MASTERCHEF) {
          tx = await contract?.withdraw(pid, amount, {
            gasPrice: getGasPrice(),
          })
        } else {
          tx = await contract?.withdraw(pid, amount, account, {
            gasPrice: getGasPrice(),
          })
        }

        return tx
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [account, chef, contract]
  )

  const harvest = useCallback(
    async (pid: number) => {
      try {
        let tx

        if (chef === Chef.MASTERCHEF) {
          tx = await contract?.deposit(pid, Zero, {
            gasPrice: getGasPrice(),
          })
        } else if (chef === Chef.MASTERCHEF_V2) {
          const pendingSushi = await contract?.pendingSushi(pid, account)

          const balanceOf = await sushi?.balanceOf(contract?.address)

          // If MasterChefV2 doesn't have enough sushi to harvest, batch in a harvest.
          if (pendingSushi.gt(balanceOf)) {
            tx = await contract?.batch(
              [
                contract?.interface?.encodeFunctionData('harvestFromMasterChef'),
                contract?.interface?.encodeFunctionData('harvest', [pid, account]),
              ],
              true
            )
          } else {
            tx = await contract?.harvest(pid, account, {
              gasPrice: getGasPrice(),
            })
          }
        }

        return tx
      } catch (e) {
        console.error(e)
        return e
      }
    },
    [account, chef, contract, sushi]
  )

  return { deposit, withdraw, harvest }
}
