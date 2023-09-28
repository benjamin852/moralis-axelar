import { useState, useEffect } from 'react';
import {
  TableContainer,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
  Tfoot,
  VStack,
  Heading,
  Box,
  Text,
  Avatar,
  HStack,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Input,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { useEvmWalletTokenBalances } from '@moralisweb3/next';
import { useSession } from 'next-auth/react';
import { getEllipsisTxt } from 'utils/format';
import { useNetwork, usePrepareContractWrite, useContractWrite } from 'wagmi';
import abi from '../../../../../contract/abi.json';

const ERC20Balances = () => {
  const hoverTrColor = useColorModeValue('gray.100', 'gray.700');
  const { data } = useSession();
  const { chain } = useNetwork();

  const availableChains = [
    { chainName: 'Ethereum', chainId: 5 },
    { chainName: 'Polygon', chainId: 80001 },
    { chainName: 'Avalanche', chainId: 43114 },
  ];

  const [queriedChain, setQueriedChain] = useState({ chainName: '', chainId: chain?.id });
  const [selectedDestChain, setSelectedDestChain] = useState(0);
  const [receiverAddrs, setReceiverAddrs] = useState<string[]>([]);
  const [selectedToken, setSelectedToken] = useState({ tokenSymbol: '', tokenAddr: '', transferAmount: 0 });

  const { data: tokenBalances } = useEvmWalletTokenBalances({
    address: data?.user?.address,
    chain: queriedChain.chainId,
  });

  useEffect(() => {
    if (chain) setQueriedChain({ ...queriedChain, chainName: chain.name });
  }, [chain]);

  const updateReceiverAddrs = (index: number, value: string) => {
    const updatedList = [...receiverAddrs];
    updatedList[index] = value;
    setReceiverAddrs(updatedList);
  };

  const contractAddr = '';

  const { config } = usePrepareContractWrite({
    address: contractAddr,
    abi: abi,
    chainId: selectedDestChain,
    functionName: 'sendToMany(string,string,address[],string,uint256)',
    args: [selectedDestChain, contractAddr, receiverAddrs, selectedToken.tokenSymbol, selectedToken.transferAmount],
  });

  const { write } = useContractWrite(config);

  return (
    <>
      <Heading size="lg" marginBottom={6}>
        ERC20 Balances
      </Heading>
      <Menu>
        {({ isOpen }) => (
          <>
            <MenuButton isActive={isOpen} as={Button} rightIcon={<ChevronDownIcon />}>
              {queriedChain?.chainName}
            </MenuButton>
            <MenuList>
              {availableChains.map((chain) => (
                <MenuItem
                  key={chain.chainId}
                  onClick={() => setQueriedChain({ chainName: chain.chainName, chainId: chain.chainId })}
                >
                  {chain.chainName}
                </MenuItem>
              ))}
            </MenuList>
          </>
        )}
      </Menu>
      {tokenBalances?.length ? (
        <Box border="2px" borderColor={hoverTrColor} borderRadius="xl" padding="24px 18px">
          <TableContainer w={'full'}>
            <Table>
              <Thead>
                <Tr>
                  <Th>Token</Th>
                  <Th>Value</Th>
                  <Th isNumeric>Address</Th>
                  <Th textAlign="center">Transfer To</Th>
                </Tr>
              </Thead>
              <Tbody>
                {tokenBalances?.map(({ token, value }, key) => (
                  <Tr key={`${token?.symbol}-${key}-tr`} _hover={{ bgColor: hoverTrColor }} cursor="pointer">
                    <Td>
                      <HStack>
                        <Avatar size="sm" src={token?.logo || ''} name={token?.name} />
                        <VStack alignItems={'flex-start'}>
                          <Text as={'span'}>{token?.name}</Text>
                          <Text fontSize={'xs'} as={'span'}>
                            {token?.symbol}
                          </Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td>{value}</Td>
                    <Td isNumeric>{getEllipsisTxt(token?.contractAddress.checksum)}</Td>
                    <Td>
                      <VStack>
                        <Menu>
                          {({ isOpen }) => (
                            <>
                              <MenuButton isActive={isOpen} as={Button} size="s" rightIcon={<ChevronDownIcon />}>
                                Select chain
                              </MenuButton>
                              <MenuList>
                                {availableChains.map((chain) =>
                                  queriedChain.chainId !== chain.chainId ? (
                                    <MenuItem key={chain.chainId} onClick={() => setSelectedDestChain(chain.chainId)}>
                                      {chain.chainName}
                                    </MenuItem>
                                  ) : null,
                                )}
                              </MenuList>
                            </>
                          )}
                        </Menu>
                        <Input
                          placeholder="Receiving Addresses"
                          size="sm"
                          value={receiverAddrs[key] || ''}
                          onChange={(e) => updateReceiverAddrs(key, e.target.value)}
                        />
                        <Button onClick={() => write?.()}>Transfer</Button>
                      </VStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
              <Tfoot>
                <Tr>
                  <Th>Token</Th>
                  <Th>Value</Th>
                  <Th isNumeric>Address</Th>
                  <Th>Transfer To</Th>
                </Tr>
              </Tfoot>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Box>Looks Like you do not have any ERC20 tokens</Box>
      )}
    </>
  );
};

export default ERC20Balances;
