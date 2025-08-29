import { PageShell } from '../components/pageShell';
import { useAgent } from '../useCases/useAgent';
import { useContext, useEffect, useState } from 'react';
import { AppContext } from '../utils/appContext';
import Map from '../components/map';

const Flow = () => {
  const { selectedKey } = useAgent();

  const { colorScheme, graph, requestGraph, rankingFilter } =
    useContext(AppContext);

  const [peekGraphKey, setPeekGraphKey] = useState<string | null | undefined>();

  const whichKey =
    peekGraphKey ||
    selectedKey ||
    '0000000000000000000000000000000000000000000=';

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (whichKey) {
        requestGraph(whichKey);
      }
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [whichKey, requestGraph]);

  useEffect(() => {
    const resultHandler = (data: any) => {
      if (whichKey && data.detail) {
        requestGraph(whichKey);
      }
    };

    document.addEventListener('inv_stage', resultHandler);

    return () => {
      document.removeEventListener('inv_stage', resultHandler);
    };
  }, [whichKey, requestGraph]);

  return (
    <PageShell
      renderBody={() => (
        <>
          {!!whichKey && (
            <>
              {!!graph && (
                <Map
                  forKey={whichKey}
                  nodes={graph.nodes ?? []}
                  links={graph.links ?? []}
                  setForKey={setPeekGraphKey}
                  rankingFilter={rankingFilter}
                  colorScheme={colorScheme}
                />
              )}
            </>
          )}
        </>
      )}
    />
  );
};

export default Flow;
