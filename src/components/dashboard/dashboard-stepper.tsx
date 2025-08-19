
'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CampaignOutput } from '@/ai/flows/run-campaign';
import { ApiKeySetup } from './api-key-setup';
import { ChannelSearch } from './channel-search';
import { VideoSelection } from './video-selection';
import { CommentForm } from './comment-form';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Video, Channel } from './dashboard-client';

type StepperProps = {
    apiKey: string | null;
    isYouTubeConnected: boolean;
    areSettingsLoading: boolean;
    onCredentialsUpdate: () => void;

    selectedChannels: Channel[];
    onChannelsChange: (channels: Channel[]) => void;
    
    selectedVideos: Video[];
    onSelectedVideosChange: (videos: Video[]) => void;
    
    onCampaignComplete: (results: CampaignOutput['results']) => void;
};

export function DashboardStepper({
    apiKey, isYouTubeConnected, areSettingsLoading, onCredentialsUpdate,
    selectedChannels, onChannelsChange,
    selectedVideos, onSelectedVideosChange,
    onCampaignComplete
}: StepperProps) {
    const [currentStep, setCurrentStep] = useState(1);

    const steps = useMemo(() => [
        { id: 1, title: "Setup Credentials", isComplete: !!apiKey && isYouTubeConnected },
        { id: 2, title: "Select Channels", isComplete: selectedChannels.length > 0 },
        { id: 3, title: "Select Videos", isComplete: selectedVideos.length > 0 },
        { id: 4, title: "Launch Campaign", isComplete: false },
    ], [apiKey, isYouTubeConnected, selectedChannels, selectedVideos]);

    const canGoToNextStep = useMemo(() => {
        switch (currentStep) {
            case 1: return steps[0].isComplete;
            case 2: return steps[1].isComplete;
            case 3: return steps[2].isComplete;
            default: return false;
        }
    }, [currentStep, steps]);

    const goToNextStep = () => {
        if (canGoToNextStep) {
            setCurrentStep(s => Math.min(s + 1, steps.length));
        }
    };

    const goToPrevStep = () => {
        setCurrentStep(s => Math.max(s - 1, 1));
    };
    
    const goToStep = (stepId: number) => {
        // Allow navigation only to completed steps or the current step
        if (steps[stepId - 1].isComplete || stepId === currentStep) {
            setCurrentStep(stepId);
        }
    }
    
    const variants = {
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 },
    };

    return (
        <div className="space-y-8">
            {/* Stepper Navigation */}
            <div className="flex items-center justify-between border-b pb-4">
                {steps.map((step, index) => (
                    <div key={step.id} className="flex items-center">
                        <button
                            onClick={() => goToStep(step.id)}
                            disabled={index > 0 && !steps[index - 1].isComplete}
                            className={cn(
                                "flex items-center gap-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
                                currentStep === step.id ? "text-primary" : "text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground"
                            )}
                        >
                            <div className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs",
                                currentStep === step.id ? "border-primary bg-primary/10" :
                                step.isComplete ? "border-green-500 bg-green-500/10 text-green-600" :
                                "border-border"
                            )}>
                                {step.isComplete && currentStep !== step.id ? <Check size={14} /> : step.id}
                            </div>
                            <span className="hidden md:inline">{step.title}</span>
                        </button>
                        {index < steps.length - 1 && <div className="mx-4 h-px w-8 flex-1 bg-border" />}
                    </div>
                ))}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
                 <motion.div
                    key={currentStep}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    variants={variants}
                    transition={{ duration: 0.3 }}
                >
                    {currentStep === 1 && (
                         <ApiKeySetup
                            currentApiKey={apiKey}
                            isYouTubeConnected={isYouTubeConnected}
                            onCredentialsUpdate={onCredentialsUpdate}
                            onYouTubeConnectionUpdate={() => {}}
                            isLoading={areSettingsLoading}
                        />
                    )}
                    {currentStep === 2 && (
                         <ChannelSearch
                            apiKey={apiKey}
                            selectedChannels={selectedChannels}
                            onChannelsChange={onChannelsChange}
                            disabled={!steps[0].isComplete}
                         />
                    )}
                    {currentStep === 3 && (
                        <VideoSelection
                            apiKey={apiKey}
                            channels={selectedChannels}
                            selectedVideos={selectedVideos}
                            onSelectedVideosChange={onSelectedVideosChange}
                            disabled={!steps[1].isComplete}
                        />
                    )}
                     {currentStep === 4 && (
                        <CommentForm
                            selectedVideos={selectedVideos}
                            onCampaignComplete={onCampaignComplete}
                            disabled={!steps[2].isComplete}
                        />
                     )}
                 </motion.div>
            </AnimatePresence>

            {/* Stepper Footer */}
            <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={goToPrevStep} disabled={currentStep === 1}>
                    <ArrowLeft className="mr-2" />
                    Previous
                </Button>
                <Button onClick={goToNextStep} disabled={!canGoToNextStep}>
                    Next
                    <ArrowRight className="ml-2" />
                </Button>
            </div>
        </div>
    );
}
