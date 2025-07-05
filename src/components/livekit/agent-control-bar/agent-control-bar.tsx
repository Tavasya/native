'use client';

import * as React from 'react';
import { Track } from 'livekit-client';
import { BarVisualizer, useRemoteParticipants, useTranscriptions } from '@livekit/components-react';
import { ChatTextIcon, PhoneDisconnectIcon } from '@phosphor-icons/react/dist/ssr';
import { ChatInput } from '@/components/livekit/chat/chat-input';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { AppConfig } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DeviceSelect } from '../device-select';
import { TrackToggle } from '../track-toggle';
import { UseAgentControlBarProps, useAgentControlBar } from './hooks/use-agent-control-bar';

export interface AgentControlBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    UseAgentControlBarProps {
  capabilities: Pick<AppConfig, 'supportsChatInput' | 'supportsVideoInput' | 'supportsScreenShare'>;
  onChatOpenChange?: (open: boolean) => void;
  onSendMessage?: (message: string) => Promise<void>;
  onDisconnect?: () => void;
  onDeviceError?: (error: { source: Track.Source; error: Error }) => void;
}

/**
 * A control bar specifically designed for voice assistant interfaces
 */
export function AgentControlBar({
  controls,
  saveUserChoices = true,
  capabilities,
  className,
  onSendMessage,
  onChatOpenChange,
  onDisconnect,
  onDeviceError,
  ...props
}: AgentControlBarProps) {
  const participants = useRemoteParticipants();
  const [chatOpen, setChatOpen] = React.useState(false);
  const [isSendingMessage, setIsSendingMessage] = React.useState(false);
  const [captionsEnabled, setCaptionsEnabled] = React.useState(true);
  const transcriptions = useTranscriptions();
  
  // Get the latest agent transcript only
  const latestAgentTranscript = React.useMemo(() => {
    // Look for transcripts that are likely from the agent
    const agentTranscripts = transcriptions.filter(t => {
      const text = t.text.trim();
      const participantIdentity = t.participantInfo?.identity || '';
      
      // Skip empty text
      if (!text) return false;
      
      // Agent typically has identity that doesn't include "user" or is system-generated
      const isLikelyAgent = !participantIdentity.includes('user') && 
                           (participantIdentity.includes('agent') || 
                            participantIdentity.length === 0 ||
                            participantIdentity.startsWith('lk-'));
      
      return isLikelyAgent;
    });
    
    return agentTranscripts[agentTranscripts.length - 1]?.text || '';
  }, [transcriptions]);

  const isAgentAvailable = participants.some((p) => p.isAgent);
  const isInputDisabled = !chatOpen || !isAgentAvailable || isSendingMessage;

  const {
    micTrackRef,
    visibleControls,
    cameraToggle,
    microphoneToggle,
    screenShareToggle,
    handleAudioDeviceChange,
    handleVideoDeviceChange,
    handleDisconnect,
    pushToTalk,
  } = useAgentControlBar({
    controls,
    saveUserChoices,
  });

  const handleSendMessage = async (message: string) => {
    setIsSendingMessage(true);
    try {
      await onSendMessage?.(message);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const onLeave = () => {
    handleDisconnect();
    onDisconnect?.();
  };

  React.useEffect(() => {
    onChatOpenChange?.(chatOpen);
  }, [chatOpen, onChatOpenChange]);

  return (
    <>
      {/* Agent Captions - above control bar (shown when captions enabled and chat closed) */}
      {latestAgentTranscript && captionsEnabled && !chatOpen && (
        <div className="mb-6 text-center">
          <p className="text-lg text-gray-800 leading-relaxed w-96 mx-auto font-medium">
            {latestAgentTranscript}
          </p>
        </div>
      )}
      
      <div
        aria-label="Voice assistant controls"
        className={cn(
          'bg-background border-bg2 dark:border-separator1 flex flex-col rounded-[31px] border p-3 drop-shadow-md/3',
          className
        )}
        {...props}
      >
      {capabilities.supportsChatInput && (
        <div
          {...(!chatOpen ? { inert: "" as any } : {})}
          className={cn(
            'overflow-hidden transition-[height] duration-300 ease-out',
            chatOpen ? 'h-[57px]' : 'h-0'
          )}
        >
          <div className="flex h-8 w-full">
            <ChatInput onSend={handleSendMessage} disabled={isInputDisabled} className="w-full" />
          </div>
          <hr className="border-bg2 my-3" />
        </div>
      )}

      <div className="flex flex-row justify-between gap-1">
        <div className="flex gap-1">
          {visibleControls.microphone && (
            <div className="flex items-center gap-0">
              <TrackToggle
                variant="default"
                source={Track.Source.Microphone}
                pressed={microphoneToggle.enabled}
                disabled={microphoneToggle.pending}
                onPressedChange={microphoneToggle.toggle}
                className={cn([
                  "peer/track group/track relative w-auto pr-3 pl-3 md:rounded-r-none md:border-r-0 md:pr-2",
                  pushToTalk.isPttActive && "ring-2 ring-blue-500 ring-offset-2 ring-offset-background"
                ])}
              >
                <BarVisualizer
                  barCount={3}
                  trackRef={micTrackRef}
                  options={{ minHeight: 5 }}
                  className="flex h-full w-auto items-center justify-center gap-0.5"
                >
                  <span
                    className={cn([
                      'h-full w-0.5 origin-center rounded-2xl',
                      'group-data-[state=on]/track:bg-fg1 group-data-[state=off]/track:bg-destructive-foreground',
                      'data-lk-muted:bg-muted',
                    ])}
                  ></span>
                </BarVisualizer>
              </TrackToggle>
              <hr className="bg-separator1 peer-data-[state=off]/track:bg-separatorSerious relative z-10 -mr-px hidden h-4 w-px md:block" />
              <DeviceSelect
                kind="audioinput"
                onError={(error) =>
                  onDeviceError?.({ source: Track.Source.Microphone, error: error as Error })
                }
                onActiveDeviceChange={handleAudioDeviceChange}
                className={cn([
                  'pl-2',
                  'peer-data-[state=off]/track:text-destructive-foreground',
                  'hover:text-fg1 focus:text-fg1',
                  'hover:peer-data-[state=off]/track:text-destructive-foreground focus:peer-data-[state=off]/track:text-destructive-foreground',
                  'hidden rounded-l-none md:block',
                ])}
              />
            </div>
          )}

          {/* Video capability commented out 
          {capabilities.supportsVideoInput && visibleControls.camera && (
            <div className="flex items-center gap-0">
              <TrackToggle
                variant="default"
                source={Track.Source.Camera}
                pressed={cameraToggle.enabled}
                pending={cameraToggle.pending}
                disabled={cameraToggle.pending}
                onPressedChange={cameraToggle.toggle}
                className="peer/track relative w-auto rounded-r-none pr-3 pl-3 disabled:opacity-100 md:border-r-0 md:pr-2"
              />
              <hr className="bg-separator1 peer-data-[state=off]/track:bg-separatorSerious relative z-10 -mr-px hidden h-4 w-px md:block" />
              <DeviceSelect
                kind="videoinput"
                onError={(error) =>
                  onDeviceError?.({ source: Track.Source.Camera, error: error as Error })
                }
                onActiveDeviceChange={handleVideoDeviceChange}
                className={cn([
                  'pl-2',
                  'peer-data-[state=off]/track:text-destructive-foreground',
                  'hover:text-fg1 focus:text-fg1',
                  'hover:peer-data-[state=off]/track:text-destructive-foreground focus:peer-data-[state=off]/track:text-destructive-foreground',
                  'rounded-l-none',
                ])}
              />
            </div>
          )}
          */}

          {/* Screen share capability commented out
          {capabilities.supportsScreenShare && visibleControls.screenShare && (
            <div className="flex items-center gap-0">
              <TrackToggle
                variant="outline"
                source={Track.Source.ScreenShare}
                pressed={screenShareToggle.enabled}
                disabled={screenShareToggle.pending}
                onPressedChange={screenShareToggle.toggle}
                className="relative w-auto"
              />
            </div>
          )}
          */}

          {/* CC (Captions) Toggle */}
          <div className="flex items-center gap-0">
            <button
              type="button"
              aria-pressed={captionsEnabled}
              data-state={captionsEnabled ? "on" : "off"}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-accent data-[state=on]:text-accent-foreground border border-input bg-transparent hover:bg-accent hover:text-accent-foreground px-3 aspect-square h-full"
              aria-label="Toggle captions"
              onClick={() => setCaptionsEnabled(!captionsEnabled)}
            >
              <span className="font-bold text-xs">CC</span>
            </button>
          </div>

          {visibleControls.chat && (
            <Toggle
              variant="outline"
              aria-label="Toggle chat"
              pressed={chatOpen}
              onPressedChange={setChatOpen}
              disabled={!isAgentAvailable}
              className="aspect-square h-full"
            >
              <ChatTextIcon weight="bold" />
            </Toggle>
          )}
        </div>
        {visibleControls.leave && (
          <Button variant="destructive" onClick={onLeave} className="font-mono">
            <PhoneDisconnectIcon weight="bold" />
            <span className="hidden md:inline">END CALL</span>
            <span className="inline md:hidden">END</span>
          </Button>
        )}
      </div>
      
      {pushToTalk.isPttActive && (
        <div className="mt-2 flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
          <span>Hold SPACE to talk</span>
        </div>
      )}
    </div>
    </>
  );
}
