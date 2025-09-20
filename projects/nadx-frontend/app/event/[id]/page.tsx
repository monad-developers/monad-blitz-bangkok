'use client';

import { EventMarketItem } from '@/components/event/EventMarketItem';
import { TrendingHeader, TrendingPrediction } from '@/components/trending';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePublicApi } from '@/hooks/useAPI';
import { IPolyEvent, IPolyMarket } from '@/types/poly.types';
import { ENV } from '@/utils/ENV';
import {
  getBarChartData,
  polyGetActiveMarket,
  polyGetPrice,
} from '@/utils/poly-utils';
import { NadXPredictionABI } from '@/web3/abi/NadxPredictionABI';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { motion, percent } from 'framer-motion';
import { CheckCircle, ChevronDown, Star } from 'lucide-react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Address } from 'viem';
import {
  useAccount,
  useBalance,
  useConnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSendTransaction,
  useReadContract,
} from 'wagmi';

import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import { readContract, simulateContract } from 'viem/actions';
import { config, publicClient } from '@/web3/chain';
import { monadTestnet } from 'viem/chains';

const MySwal = withReactContent(Swal);

export default function EventPage() {
  const params = useParams();
  const id = params.id as string;

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [predictionAmount, setPredictionAmount] = useState<string>('20000');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USDC');

  const handleOptionSelect = (optionId: string) => {
    setSelectedOption(optionId);
  };

  const estimatedReturn = selectedOption ? '$44,424.18' : '$0.00';

  const [event, setEvent] = useState<IPolyEvent>();
  const slugId = useParams().id as string;
  const api = usePublicApi();
  const router = useRouter();

  useEffect(() => {
    if (slugId) {
      fetchEvent(slugId);
    }
  }, [slugId]);

  const fetchEvent = async (slug: string) => {
    const response = await api.poly.getBySlug(slug);
    if (response.data) {
      setEvent(response.data);
    } else {
      router.push('/');
    }
  };

  const [selectedMarket, setSelectedMarket] = useState<IPolyMarket>();

  const handleSelect = (m: IPolyMarket) => {
    setSelectedMarket(m);
  };

  const { isConnected } = useAccount();

  const [amount, setAmount] = useState('');

  const onChangeAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const { address } = useAccount();
  const balance = useBalance({
    address,
  });

  const estimateReturn = useMemo(() => {
    if (!selectedMarket || !amount) return '0.00';
    const price = polyGetPrice(selectedMarket);
    const estimated = (parseFloat(amount) / (price / 100)).toFixed(2);
    return `$${estimated}`;
  }, [selectedMarket, amount]);

  const NadxContractAddress = ENV.NADX_CONTRACT_ADDRESS;

  // console.log(balance.data?.value);

  const {
    data: writeData,
    writeContract,
    error: writeError,
    isPending: isClaimLoading,
  } = useWriteContract();

  const handleSubmitPrediction = async () => {
    if (!selectedMarket || !amount) return;
    if (!amount) return;
    if (!event) return;

    try {
      writeContract({
        abi: NadXPredictionABI,
        functionName: 'bet',
        args: [BigInt(event.id), BigInt(selectedMarket.id)],
        address: NadxContractAddress as Address,
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        text: 'Error submitting prediction',
      });
    }
  };

  const { isSuccess: isClaimSuccess, error: confirmError } =
    useWaitForTransactionReceipt({
      hash: writeData,
    });

  useEffect(() => {
    if (isClaimSuccess) {
      Swal.fire({
        icon: 'success',
        text: 'Prediction submitted successfully',
      });
    }
  }, [isClaimSuccess]);

  // const getBetDetail = async () => {
  //   const result = await publicClient.readContract({
  //     abi: NadXPredictionABI,
  //     functionName: 'getBetDetails',
  //     args: [event ? BigInt(event.id) : BigInt(0), address as any],
  //     address: NadxContractAddress as Address,
  //   });

  //   console.log('result', result);
  // };

  return (
    <>
      <TrendingHeader />
      {event && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`relative w-3/4 bg-white rounded-2xl shadow-sm border border-gray-100`}
            >
              {/* Top Bar with Rewards and Live Badge */}
              <div className="flex items-center justify-between py-4 px-6 rounded-t-2xl bg-[#F4FAF8] relative overflow-hidden">
                <Image
                  src="/svg/coin_slide.svg"
                  alt="coin slide"
                  className="absolute top-0 right-28"
                  width={120}
                  height={232}
                />
                <div className="flex items-center space-x-2 relative z-10"></div>
                <Badge className="rounded-2xl border-pink-200 bg-pink-50 text-pink-700 text-sm relative z-10">
                  <div className="h-2 w-2 rounded-full bg-pink-500 mr-2"></div>
                  Live
                </Badge>
              </div>

              {/* Main Content Area */}
              <div className="space-y-4 px-6 py-8 z-10 bg-white relative -top-2 rounded-t-xl">
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Image
                      src={event.icon}
                      alt={event.ticker}
                      width={32}
                      height={32}
                    />
                    <h3 className="text-lg text-gray-900">{event.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    {event.tags.splice(0, 3).map((t) => (
                      <div
                        key={`t-${t.label}`}
                        className="text-xs text-gray-700 border border-gray-200 rounded-md px-2 py-1"
                      >
                        {t.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prediction Result */}
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-green-600">66%</span>
                  <span className="text-[#535862]">$350-$360</span>
                  <span className="text-sm text-[#4F45B5]">
                    $128,756,009 Vol.
                  </span>
                </div>
              </div>
              <div className="space-y-4 px-10 py-4">
                <div className="flex items-end justify-between h-56">
                  {getBarChartData(polyGetActiveMarket(event.markets)).map(
                    (bar) => (
                      <div
                        key={bar.name}
                        className="flex flex-col items-center space-y-2"
                      >
                        <div className="flex flex-col justify-end h-56 w-8">
                          <div
                            className="w-full rounded-t-md -mb-1.5"
                            style={{
                              height: `${bar.c}%`,
                              backgroundColor: '#E1E5E9',
                            }}
                          />
                          <div
                            className="w-full rounded-t-md -mb-1.5"
                            style={{
                              height: `${bar.b}%`,
                              backgroundColor: '#6F61FF',
                            }}
                          />
                          <div
                            className="w-full rounded-t-md"
                            style={{
                              height: `${bar.a}%`,
                              backgroundColor: '#4F45B5',
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {bar.name}
                        </span>
                      </div>
                    )
                  )}
                </div>
              </div>
              <div className="text-lg text-gray-600 px-10 py-4">
                Choose your prediction
              </div>

              {/* Prediction Options Section */}
              <div className="px-10 pb-6 space-y-3">
                {polyGetActiveMarket(event.markets).map((m) => {
                  return (
                    <EventMarketItem
                      key={m.id}
                      market={m}
                      selectedMarket={selectedMarket}
                      handleSelect={handleSelect}
                    />
                  );
                })}
              </div>
              <hr className="border-gray-200 mx-4" />
              <div className="px-10 py-4">
                <div className="text-lg text-gray-600">Description</div>
                <p className="text-xs">{event.description}</p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`relative w-1/4 bg-white`}
            >
              <div>Select</div>

              {selectedMarket && (
                <div className="p-4 mt-2 rounded-xl bg-[#F1EFFF] border border-[#6F61FF]">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-lg font-normal text-gray-800">
                        {selectedMarket.groupItemTitle}
                      </div>
                      <div className="flex items-center gap-1">
                        {/* <div className="text-sm text-[#535862]"></div> */}
                        {/* <div className="border-l border-gray-300 h-4" /> */}
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>{polyGetPrice(selectedMarket).toFixed(2)}%</div>
                      </div>
                    </div>
                    <div>¢{polyGetPrice(selectedMarket).toFixed(2)}</div>
                    <CheckCircle className="h-5 w-5 text-[#6558E8]" />
                  </div>
                </div>
              )}

              <div className="pt-4 pb-1">Enter your prediction amount</div>
              <div className="bg-[#FAFAFA] p-4 rounded-xl">
                <div className="flex items-start justify-between">
                  <div className="w-full">
                    <div className="flex gap-2">
                      <Input
                        value={amount}
                        onChange={onChangeAmount}
                        type="number"
                        disabled={!selectedMarket}
                        placeholder="Enter amount"
                        className="text-xl font-semibold text-gray-900 tracking-tight"
                      />
                      <div className="flex gap-1 items-center">
                        <Image
                          src="/svg/token/monad.svg"
                          alt="btc"
                          width={24}
                          height={24}
                        />
                        {/* <div className="text-sm font-medium">Monad</div> */}
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="flex w-full items-center gap-1 mt-2">
                      <div className="border border-gray-300 rounded-full text-center px-2">
                        10%
                      </div>
                      <div className="border border-gray-300 rounded-full text-center px-2">
                        5%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-[#FAFAFA] p-4 rounded-xl mt-2">
                <div className="flex justify-between items-center gap-2">
                  <div>Estimated Return:</div>
                  <div className="text-base text-[#079455] tracking-tight">
                    {estimateReturn}
                  </div>
                  <Image
                    src="/svg/token/monad.svg"
                    alt="btc"
                    width={14}
                    height={14}
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div>Reward:</div>
                  <div className="text-xs border border-gray-300 rounded-full px-2 py-1 tracking-tight">
                    +10 XP
                  </div>
                </div>
              </div>
              <div className="mt-2 space-y-2">
                {isConnected && (
                  <Button
                    onClick={handleSubmitPrediction}
                    className="w-full rounded-2xl bg-[#6558E8] hover:bg-purple-700 text-white"
                  >
                    Submit Prediction
                  </Button>
                )}
                {isConnected && (
                  <Button
                    variant="outline"
                    className="w-full rounded-2xl border-gray-300 text-gray-600 hover:bg-gray-50"
                  >
                    <Star className="w-4 h-4" />
                    Add to Prelist
                  </Button>
                )}
                {!isConnected && (
                  <div className="flex justify-center">
                    <ConnectButton />
                  </div>
                )}
              </div>
              <div className="border border-gray-200 mt-4 rounded-xl p-4">
                <div className="text-lg font-medium text-gray-900">
                  Your Prediction History
                </div>
                <div className="border border-[#6F61FF] rounded-xl p-4 mt-3">
                  <div>$350-$360</div>
                  <div className="flex gap-1">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>66%</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </>
  );
}
