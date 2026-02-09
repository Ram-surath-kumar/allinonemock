import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Maximize2, Minimize2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface CallOverlayProps {
    call: {
        id: string;
        room_name: string;
        type: 'audio' | 'video';
        caller_id: string;
        receiver_id: string;
        status: 'initiated' | 'ongoing' | 'ended';
    };
    currentUser: { id: string; name: string; avatar?: string };
    otherUser: { id: string; name: string; avatar?: string };
    isIncoming: boolean;
    onAccept: () => void;
    onReject: () => void;
    onEnd: () => void;
}

declare global {
    interface Window {
        JitsiMeetExternalAPI: any;
    }
}

export function CallOverlay({
    call,
    currentUser,
    otherUser,
    isIncoming,
    onAccept,
    onReject,
    onEnd
}: CallOverlayProps) {
    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const [jitsiApi, setJitsiApi] = useState<any>(null);
    const [isAccepted, setIsAccepted] = useState(!isIncoming);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(call.type === 'audio');
    const [isMinimized, setIsMinimized] = useState(false);

    useEffect(() => {
        if (isAccepted && !jitsiApi && jitsiContainerRef.current) {
            const loadJitsiScript = () => {
                return new Promise((resolve) => {
                    if (window.JitsiMeetExternalAPI) {
                        resolve(true);
                        return;
                    }
                    const script = document.createElement('script');
                    script.src = 'https://meet.jit.si/external_api.js';
                    script.async = true;
                    script.onload = () => resolve(true);
                    document.body.appendChild(script);
                });
            };

            loadJitsiScript().then(() => {
                const domain = 'meet.jit.si';
                const options = {
                    roomName: call.room_name,
                    width: '100%',
                    height: '100%',
                    parentNode: jitsiContainerRef.current,
                    userInfo: {
                        displayName: currentUser.name,
                    },
                    configOverwrite: {
                        startWithAudioMuted: false,
                        startWithVideoMuted: call.type === 'audio',
                        disableDeepLinking: true,
                        prejoinPageEnabled: false,
                        enableWelcomePage: false,
                    },
                    interfaceConfigOverwrite: {
                        TOOLBAR_BUTTONS: [
                            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                            'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
                            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
                            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
                            'security'
                        ],
                    }
                };
                const api = new window.JitsiMeetExternalAPI(domain, options);

                api.addEventListeners({
                    readyToClose: () => {
                        onEnd();
                    },
                    videoConferenceLeft: () => {
                        onEnd();
                    },
                    audioMuteStatusChanged: (payload: any) => {
                        setIsMuted(payload.muted);
                    },
                    videoMuteStatusChanged: (payload: any) => {
                        setIsVideoOff(payload.muted);
                    }
                });

                setJitsiApi(api);
            });
        }

        return () => {
            if (jitsiApi) {
                jitsiApi.dispose();
            }
        };
    }, [isAccepted]);

    const handleToggleMute = () => {
        if (jitsiApi) {
            jitsiApi.executeCommand('toggleAudio');
        } else {
            setIsMuted(!isMuted);
        }
    };

    const handleToggleVideo = () => {
        if (jitsiApi) {
            jitsiApi.executeCommand('toggleVideo');
        } else {
            setIsVideoOff(!isVideoOff);
        }
    };

    if (!isAccepted) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-background border border-border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden p-8 flex flex-col items-center gap-6">
                    <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-primary/20">
                            <AvatarImage src={otherUser.avatar} />
                            <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                {otherUser.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-2 rounded-full animate-bounce">
                            {call.type === 'video' ? <Video className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                        </div>
                    </div>

                    <div className="text-center">
                        <h3 className="text-xl font-semibold">{otherUser.name}</h3>
                        <p className="text-muted-foreground animate-pulse">
                            Incoming {call.type} call...
                        </p>
                    </div>

                    <div className="flex items-center gap-8 mt-4">
                        <Button
                            variant="destructive"
                            size="icon"
                            className="h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform"
                            onClick={onReject}
                        >
                            <PhoneOff className="h-6 w-6" />
                        </Button>
                        <Button
                            variant="default"
                            size="icon"
                            className="h-14 w-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:scale-110 transition-transform"
                            onClick={() => {
                                setIsAccepted(true);
                                onAccept();
                            }}
                        >
                            <Phone className="h-6 w-6" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn(
            "fixed z-[100] transition-all duration-500 overflow-hidden",
            isMinimized
                ? "bottom-4 right-4 w-80 h-48 rounded-xl shadow-2xl border-2 border-primary bg-black"
                : "inset-0 bg-black"
        )}>
            <div ref={jitsiContainerRef} className="w-full h-full" />

            <div className={cn(
                "absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 bg-black/40 backdrop-blur-md rounded-full border border-white/20 transition-opacity z-10",
                isMinimized ? "opacity-0 pointer-events-none" : "opacity-100"
            )}>
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-11 w-11 rounded-full text-white hover:bg-white/20", isMuted && "bg-red-500/80 hover:bg-red-600/80")}
                    onClick={handleToggleMute}
                >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>

                <Button
                    variant="ghost"
                    size="icon"
                    className={cn("h-11 w-11 rounded-full text-white hover:bg-white/20", isVideoOff && "bg-red-500/80 hover:bg-red-600/80")}
                    onClick={handleToggleVideo}
                >
                    {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
                </Button>

                <Button
                    variant="destructive"
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg"
                    onClick={onEnd}
                >
                    <PhoneOff className="h-6 w-6" />
                </Button>
            </div>

            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 h-10 w-10 text-white bg-black/20 hover:bg-black/40 rounded-full z-10"
                onClick={() => setIsMinimized(!isMinimized)}
            >
                {isMinimized ? <Maximize2 className="h-5 w-5" /> : <Minimize2 className="h-5 w-5" />}
            </Button>
        </div>
    );
}
