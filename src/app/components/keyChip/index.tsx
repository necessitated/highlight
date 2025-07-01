import { IonChip, IonIcon, useIonModal } from '@ionic/react';
import { receiptOutline } from 'ionicons/icons';
import { TransitionList } from '../transition';
import KeyStats, { KeyAbbrev } from '../keyStats';
import { usePubKeyTransitions } from '../../useCases/usePubKeyTxs';
import { useFlowGraph } from '../../useCases/useFlowGraph';

interface KeyChipProps {
  value: string;
  label?: string;
  readonly?: boolean;
}

export const useKeyDetails = (key: string) => {
  const [present, dismiss] = useIonModal(KeyDetails, {
    onDismiss: () => dismiss(),
    value: key,
  });

  return [present] as const;
};

const KeyChip: React.FC<KeyChipProps> = ({ value, label, readonly }) => {
  const [present] = useKeyDetails(value);

  return value ? (
    <IonChip
      onClick={
        readonly
          ? () => {}
          : (e) => {
              e.stopPropagation();
              present({
                initialBreakpoint: 0.75,
                breakpoints: [0, 0.75, 1],
              });
            }
      }
    >
      {!readonly && <IonIcon icon={receiptOutline} color="primary"></IonIcon>}
      {label ? <code>{label}</code> : <KeyAbbrev value={value} />}
    </IonChip>
  ) : null;
};

export default KeyChip;

const KeyDetails = ({
  onDismiss,
  value,
}: {
  onDismiss: () => void;
  value: string;
}) => {
  const transitions = usePubKeyTransitions(value);
  //const flowGraph = useFlowGraph(value);
  return (
    <>
      <div
        style={{
          marginTop: '20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <KeyStats value={value} />
        {!!transitions && !!transitions.length && (
          <div
            style={{
              alignSelf: 'stretch',
            }}
          >
            <TransitionList transitions={transitions} />
          </div>
        )}
      </div>
    </>
  );
};
