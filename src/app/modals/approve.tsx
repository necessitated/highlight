import { useContext, useEffect } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonIcon,
  IonInput,
  IonItem,
  IonItemDivider,
  IonList,
  IonText,
  IonTextarea,
  useIonActionSheet,
  useIonModal,
  useIonToast,
} from '@ionic/react';
import {
  ellipsisHorizontal,
  ellipsisVertical,
  qrCodeOutline,
  chevronCollapseOutline,
  duplicateOutline,
} from 'ionicons/icons';
import type { OverlayEventDetail } from '@ionic/core';
import { PageShell } from '../components/pageShell';
import { Html5QrcodePlugin } from '../utils/qr-scanner';
import { useInputValidationProps } from '../useCases/useInputValidation';
import KeyChip from '../components/keyChip';
import Agent from '../components/agent';
import { useAgent } from '../useCases/useAgent';
import { AppContext } from '../utils/appContext';
import { transitionID, shortenHex } from '../utils/compat';
import { SetupAgent } from '../components/agentSetup';
import { TransitionList } from '../components/transition';
import { usePendingTransitions } from '../useCases/usePendingTxs';
import { useProfile } from '../useCases/useProfile';

const Focus = ({
  onDismiss,
  forKey,
}: {
  onDismiss?: () => void;
  forKey?: string;
}) => {
  const { genesisStage, pushTransition } = useContext(AppContext);

  const {
    value: ideal,
    onBlur: onBlurIdeal,
    isValid: isIdealValid,
    isTouched: isIdealTouched,
    onInputChange: setIdeal,
  } = useInputValidationProps(
    (ideal: string) => new RegExp('[A-Za-z0-9/+]{43}=').test(ideal),
    forKey,
  );

  const {
    value: memo,
    onBlur: onBlurMemo,
    isValid: isMemoValid,
    isTouched: isMemoTouched,
    onInputChange: setMemo,
  } = useInputValidationProps(
    (memo: string) => memo.length > 0 || memo.length <= 150,
  );

  const [presentToast] = useIonToast();

  const execute = (passphrase: string, selectedKeyIndex: [number, number]) => {
    if (!isIdealValid || !isMemoValid) {
      return;
    }
    pushTransition(ideal, memo, passphrase, selectedKeyIndex, (data: any) => {
      presentToast({
        message:
          data.error ||
          `Transition: ${shortenHex(data.transition_id)} was executed`,
        duration: 5000,
        position: 'bottom',
      });

      if (!data.error) {
        setIdeal('');
        setMemo('');
      }
    });
  };

  const [presentScanner, dismissScanner] = useIonModal(ScanQR, {
    onDismiss: (data?: string) => dismissScanner(data),
  });

  const [presentModal, dismiss] = useIonModal(AuthorizeTransition, {
    onDismiss: () => dismiss(),
    onAuthorize: (passphrase: string, selectedKeyIndex: [number, number]) => {
      execute(passphrase, selectedKeyIndex);
      dismiss();
    },
    ideal,
    memo,
  });

  const {
    publicKeys,
    selectedKeyIndex,
    setSelectedKeyIndex,
    importAgent,
    deleteAgent,
  } = useAgent();

  const selectedKey = publicKeys[selectedKeyIndex[0]][selectedKeyIndex[1]];

  const keyProfile = useProfile(selectedKey);

  const pubKeyPoints = keyProfile?.imbalance;
  const pubKeyRanking = keyProfile?.ranking;

  const [presentActionSheet] = useIonActionSheet();

  const handleActionSheet = ({ data, role }: OverlayEventDetail) => {
    if (data?.['action'] === 'delete') {
      deleteAgent();
    }
  };

  const pendingTransitions = usePendingTransitions(selectedKey);

  return (
    <PageShell
      onDismissModal={onDismiss}
      tools={
        !!selectedKey
          ? [
              {
                label: 'action sheet',
                renderIcon: () => (
                  <IonIcon
                    slot="icon-only"
                    ios={ellipsisHorizontal}
                    md={ellipsisVertical}
                  ></IonIcon>
                ),
                action: () =>
                  presentActionSheet({
                    onDidDismiss: ({ detail }) => handleActionSheet(detail),
                    header: 'Actions',
                    buttons: [
                      {
                        text: 'Delete agent',
                        role: 'destructive',
                        data: {
                          action: 'delete',
                        },
                      },
                      {
                        text: 'Cancel',
                        role: 'cancel',
                        data: {
                          action: 'cancel',
                        },
                      },
                    ],
                  }),
              },
            ]
          : []
      }
      renderBody={() => (
        <>
          {!selectedKey ? (
            <SetupAgent importKeys={importAgent} />
          ) : (
            <>
              <section className="ion-padding-top ion-padding-start ion-padding-end">
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    <KeyChip value={selectedKey} />
                    {selectedKey && (
                      <Agent
                        hideLabel={true}
                        setSelectedKeyIndex={(key) => {
                          setSelectedKeyIndex(key);
                        }}
                        selectedKeyIndex={selectedKeyIndex}
                        publicKeys={publicKeys}
                      />
                    )}
                  </span>
                </div>
                <>
                  {pubKeyPoints !== undefined && (
                    <IonText color="primary">
                      <p>
                        <strong>Intention: </strong>
                        <i>{pubKeyPoints} pts</i>
                        <IonIcon
                          icon={chevronCollapseOutline}
                          color="primary"
                        />
                      </p>
                    </IonText>
                  )}
                  {pubKeyRanking !== undefined && (
                    <IonText color="primary">
                      <p>
                        <strong>Attention: </strong>
                        <i>{Number((pubKeyRanking / 1) * 100).toFixed(2)}%</i>
                      </p>
                    </IonText>
                  )}
                </>
              </section>
              <IonList>
                <IonItem lines="none">
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => {
                      presentScanner({
                        onWillDismiss: (
                          ev: CustomEvent<OverlayEventDetail>,
                        ) => {
                          if (typeof ev.detail.data === 'string') {
                            setIdeal(ev.detail.data);
                          }
                        },
                      });
                    }}
                  >
                    Scan
                    <IonIcon slot="end" icon={qrCodeOutline}></IonIcon>
                  </IonButton>
                </IonItem>
                <IonItem lines="none">
                  <IonInput
                    className={`${isIdealValid && 'ion-valid'} ${
                      isIdealValid === false && 'ion-invalid'
                    } ${isIdealTouched && 'ion-touched'}`}
                    label="Ideal"
                    labelPlacement="stacked"
                    clearInput={true}
                    errorText="Invalid ideal"
                    value={
                      ideal.substring(40) === '000='
                        ? ideal.replace(/0+=?$/g, '')
                        : ideal
                    }
                    onIonBlur={() => {
                      if (!new RegExp('[A-Za-z0-9/+]{43}=').test(ideal)) {
                        setIdeal(
                          `${ideal
                            .replace(/[^A-Za-z0-9/+]/gi, '')
                            .padEnd(43, '0')}=`,
                        );
                      }
                      onBlurIdeal();
                    }}
                    onIonInput={(event) =>
                      setIdeal(event.target.value?.toString() ?? '')
                    }
                  />
                </IonItem>

                <IonItem lines="none">
                  <IonButton
                    fill="clear"
                    slot="end"
                    onClick={() => {
                      const genesisTransition = genesisStage?.transitions[0];
                      const genesisRef = genesisTransition
                        ? `//${transitionID(genesisTransition)}//`
                        : '';
                      setMemo(genesisRef);
                    }}
                  >
                    Genesis Ref
                    <IonIcon slot="end" icon={duplicateOutline}></IonIcon>
                  </IonButton>
                </IonItem>

                <IonItem lines="none">
                  <IonTextarea
                    className={`${isMemoValid && 'ion-valid'} ${
                      isMemoValid === false && 'ion-invalid'
                    } ${isMemoTouched && 'ion-touched'}`}
                    label="Memo"
                    placeholder=""
                    labelPlacement="stacked"
                    counter={true}
                    maxlength={150}
                    value={memo}
                    onIonBlur={onBlurMemo}
                    onIonInput={(event) => setMemo(event.target.value ?? '')}
                  />
                </IonItem>
              </IonList>
              <IonButton
                disabled={!isIdealValid || !isMemoValid}
                expand="block"
                className="ion-padding ion-no-margin"
                strong={true}
                onClick={() =>
                  presentModal({
                    initialBreakpoint: 0.75,
                    breakpoints: [0, 0.75],
                  })
                }
              >
                Intensify
              </IonButton>
              <IonItemDivider />
              {!!pendingTransitions && !!pendingTransitions.length && (
                <TransitionList
                  heading="Pending"
                  transitions={pendingTransitions}
                />
              )}
            </>
          )}
        </>
      )}
    />
  );
};

export default Focus;

export const ScanQR = ({
  onDismiss,
}: {
  onDismiss: (decodedText?: string) => void;
}) => {
  const onNewScanResult = (decodedText: string, decodedResult: any) => {
    onDismiss(decodedText ?? '');
  };
  return (
    <PageShell
      tools={[{ label: 'Cancel', action: onDismiss }]}
      renderBody={() => (
        <IonCard>
          <IonCardSubtitle>Scan QR</IonCardSubtitle>
          <IonCardContent>
            <Html5QrcodePlugin
              fps={10}
              qrbox={250}
              disableFlip={false}
              qrCodeSuccessCallback={onNewScanResult}
            />
          </IonCardContent>
        </IonCard>
      )}
    />
  );
};

const AuthorizeTransition = ({
  onDismiss,
  onAuthorize,
  ideal,
  memo,
}: {
  onDismiss: () => void;
  onAuthorize: (passphrase: string, selectedKeyIndex: [number, number]) => void;
  ideal: string;
  memo: string;
}) => {
  const {
    value: passphrase,
    onBlur: onBlurPassphrase,
    isValid: isPassphraseValid,
    isTouched: isPassphraseTouched,
    onInputChange: setPassphrase,
  } = useInputValidationProps((input: string) => input.length > 0);

  const { publicKeys, selectedKeyIndex, setSelectedKeyIndex } = useAgent();

  return (
    <div>
      <IonCard>
        <IonCardHeader>
          <IonCardSubtitle>
            Considered by:
            <Agent
              publicKeys={publicKeys}
              selectedKeyIndex={selectedKeyIndex}
              setSelectedKeyIndex={setSelectedKeyIndex}
            />
          </IonCardSubtitle>
          <IonCardSubtitle>Confirm transition</IonCardSubtitle>
        </IonCardHeader>
        <IonCardContent>
          <IonTextarea
            aria-label="memo"
            className="ion-margin-top"
            readonly
            value={memo}
          />
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-evenly',
            }}
          >
            <KeyChip value={ideal} />
          </span>
        </IonCardContent>
      </IonCard>
      <IonCard>
        <IonCardContent>
          <IonInput
            className={`${isPassphraseValid && 'ion-valid'} ${
              isPassphraseValid === false && 'ion-invalid'
            } ${isPassphraseTouched && 'ion-touched'}`}
            label="Enter Passphrase"
            labelPlacement="stacked"
            clearInput={true}
            errorText="Invalid passphrase"
            value={passphrase}
            type="password"
            onIonBlur={onBlurPassphrase}
            onIonInput={(event) =>
              setPassphrase(event.target.value?.toString() ?? '')
            }
          />
          <IonButton
            className="ion-margin-top"
            fill="solid"
            expand="block"
            strong={true}
            disabled={!isPassphraseValid}
            onClick={() => onAuthorize(passphrase, selectedKeyIndex)}
          >
            Confirm
          </IonButton>
          <IonButton
            fill="outline"
            expand="block"
            strong={true}
            onClick={() => onDismiss()}
          >
            Cancel
          </IonButton>
        </IonCardContent>
      </IonCard>
    </div>
  );
};
