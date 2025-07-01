import { useContext } from 'react';
import { AppContext } from '../utils/appContext';

export const useFlowGraph = (pubKey: string) => {
  const { graph, rankingFilter } = useContext(AppContext);

  return graph?.nodes.map((node) => node.pubkey);
};
