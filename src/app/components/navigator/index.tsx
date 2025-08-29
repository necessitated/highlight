import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonTextarea,
  IonToolbar,
} from '@ionic/react';
import { sunnyOutline, pinOutline } from 'ionicons/icons';
import { useInputValidationProps } from '../../useCases/useInputValidation';

const Navigator = ({
  currentNode,
  onDismiss,
}: {
  currentNode: string;
  onDismiss: (data?: string | null | undefined, role?: string) => void;
}) => {
  const {
    value: node,
    isValid: isNodeValid,
    isTouched: isNodeTouched,
    onBlur: onBlurNode,
    onInputChange: setNode,
  } = useInputValidationProps((node: string) => !!node);
  const host = 'sure-formerly-filly.ngrok-free.app';
  const genesisID =
    '000000009aa5a7894d1061f299e426ecb519c076d37e296d5f0c61ed8fec6829';
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton
              color="medium"
              disabled={!currentNode && !node}
              onClick={() => onDismiss(null, 'cancel')}
            >
              Cancel
            </IonButton>
          </IonButtons>
          <IonButtons slot="end">
            <IonButton
              disabled={!node}
              onClick={() => onDismiss(node, 'confirm')}
              strong={true}
            >
              Confirm
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>
              <div
                style={{
                  marginTop: '20px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IonIcon
                  className="ion-no-padding"
                  size="large"
                  icon={sunnyOutline}
                  color="primary"
                />
                <h1
                  style={{
                    margin: '0 0 0 5px',
                  }}
                >
                  Premises
                </h1>
              </div>
              <IonText color="secondary">
                <h6>In the beginning...</h6>
              </IonText>
            </IonCardTitle>
          </IonCardHeader>
        </IonCard>
        <section className="ion-padding">
          <IonText color="primary">
            <p>Enter a consequence to continue.</p>
          </IonText>
          <IonTextarea
            className={`${isNodeValid && 'ion-valid'} ${
              isNodeValid === false && 'ion-invalid'
            } ${isNodeTouched && 'ion-touched'}`}
            label="consequence url"
            labelPlacement="stacked"
            placeholder="..."
            value={node}
            onIonBlur={onBlurNode}
            enterkeyhint="go"
            onIonInput={(event) =>
              setNode((event.target.value! ?? '').replace(/^https?:\/\//, ''))
            }
            rows={5}
          />
          <IonText color="secondary">
            <p>Or our favorite consequence:</p>
          </IonText>
          <IonChip onClick={() => setNode(`${host}/${genesisID}`)}>
            <>Necessitated</>
            <IonIcon icon={pinOutline} color="primary"></IonIcon>
          </IonChip>
        </section>
      </IonContent>
    </IonPage>
  );
};

export default Navigator;
