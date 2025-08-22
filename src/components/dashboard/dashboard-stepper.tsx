
'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CampaignOutput } from '@/ai/flows/run-campaign';
import { CredentialManager } from './credential-manager';
import { ChannelSearch } from './channel-search';
import { VideoSelection } from './video-selection';
import { CommentForm } from './comment-form';
import { CampaignReview } from './campaign-review';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Video, Channel } from './dashboard-client';
import type { CredentialSet } from '@/lib/actions/credentials';

type StepperProps = {
    credentialSets: CredentialSet[];
    onCredentialsUpdate: (sets: CredentialSet[]) => void;

    selectedCredentialSet: CredentialSet | null;
    onCredentialSelect: (credential: CredentialSet | null) => void;

    selectedChannels: Channel[];
    onChannelsChange: (channels: Channel[]) => void;
    
    selectedVideos: Video[];
    onSelectedVideosChange: (videos: Video[]) => void;

    comments: string[];
    onCommentsChange: (comments: string[]) => void;
    
    onCampaignComplete: (results: CampaignOutput['results']) => void;
};

export function DashboardStepper({
    credentialSets, onCredentialsUpdate,
    selectedCredentialSet, onCredentialSelect,
    selectedChannels, onChannelsChange,
    selectedVideos, onSelectedVideosChange,
    comments, onCommentsChange,
    onCampaignComplete
}: StepperProps) {
    const [currentStep, setCurrentStep] = useState(1);

    const areCommentsValid = useMemo(() => {
        return comments.every(c => c.trim().length > 0) && comments.length === 4;
    }, [comments]);

    const steps = useMemo(() => [
        { id: 1, title: "Credentials", isComplete: !!selectedCredentialSet?.youtubeApiKey },
        { id: 2, title: "Channels", isComplete: selectedChannels.length > 0 },
        { id: 3, title: "Videos", isComplete: selectedVideos.length > 0 },
        { id: 4, title: "Comments", isComplete: areCommentsValid },
        { id: 5, title: "Launch", isComplete: false }, // Launch step completion is handled by the component itself
    ], [selectedCredentialSet, selectedChannels, selectedVideos, areCommentsValid]);

    const canGoToNextStep = useMemo(() => {
        if (currentStep >= steps.length) return false;
        return steps[currentStep - 1].isComplete;
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
        // Allow navigation only to previously completed steps or the one after the last completed step
        const lastCompletedStepIndex = steps.findLastIndex(s => s.isComplete);
        if (stepId <= lastCompletedStepIndex + 2 && stepId <= currentStep) {
           setCurrentStep(stepId);
        }
    }

    const nextButtonText = useMemo(() => {
        if(currentStep >= steps.length) return "Finish";
        return `Next: ${steps[currentStep].title}`;
    }, [currentStep, steps]);
    
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
                    <React.Fragment key={step.id}>
                        <div className="flex items-center">
                            <button
                                onClick={() => goToStep(step.id)}
                                disabled={index > 0 && !steps[index - 1].isComplete && currentStep < step.id}
                                className={cn(
                                    "flex items-center gap-2 text-sm font-medium transition-colors disabled:cursor-not-allowed",
                                    currentStep === step.id ? "text-primary" : "text-muted-foreground hover:text-foreground disabled:hover:text-muted-foreground"
                                )}
                            >
                                <div className={cn(
                                    "flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs transition-colors",
                                    currentStep === step.id ? "border-primary bg-primary/10" :
                                    step.isComplete ? "border-green-500 bg-green-500/10 text-green-600" :
                                    "border-border"
                                )}>
                                    {step.isComplete && currentStep !== step.id ? <Check size={14} /> : step.id}
                                </div>
                                <span className="hidden md:inline">{step.title}</span>
                            </button>
                        </div>
                        {index < steps.length - 1 && <div className={cn("mx-2 h-px flex-1 bg-border transition-colors md:mx-4", { "bg-primary": currentStep > index + 1 || steps[index].isComplete })} />}
                    </React.Fragment>
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
                         <CredentialManager
                            initialCredentialSets={credentialSets}
                            selectedCredentialSet={selectedCredentialSet}
                            onCredentialSelect={onCredentialSelect}
                            onCredentialsUpdate={onCredentialsUpdate}
                        />
                    )}
                    {currentStep === 2 && (
                         <ChannelSearch
                            credentialSet={selectedCredentialSet}
                            selectedChannels={selectedChannels}
                            onChannelsChange={onChannelsChange}
                            disabled={!steps[0].isComplete}
                         />
                    )}
                    {currentStep === 3 && (
                        <VideoSelection
                            credentialSet={selectedCredentialSet}
                            channels={selectedChannels}
                            selectedVideos={selectedVideos}
                            onSelectedVideosChange={onSelectedVideosChange}
                            disabled={!steps[1].isComplete}
                        />
                    )}
                     {currentStep === 4 && (
                        <CommentForm
                            onCommentsChange={onCommentsChange}
                            disabled={!steps[2].isComplete}
                        />
                     )}
                     {currentStep === 5 && (
                         <CampaignReview
                            credentialSet={selectedCredentialSet}
                            selectedChannels={selectedChannels}
                            selectedVideos={selectedVideos}
                            comments={comments}
                            onCampaignComplete={onCampaignComplete}
                            disabled={!steps[3].isComplete}
                         />
                     )}
                 </motion.div>
            </AnimatePresence>

            {/* Stepper Footer */}
            <div className="flex justify-between items-center pt-4 border-t">
                <Button variant="outline" onClick={goToPrevStep} disabled={currentStep === 1}>
                    <ArrowLeft className="mr-2" />
                    <span className="hidden sm:inline">Previous</span>
                </Button>
                {currentStep < steps.length && (
                    <Button onClick={goToNextStep} disabled={!canGoToNextStep}>
                        <span className="hidden sm:inline">{nextButtonText}</span>
                        <span className="sm:hidden">Next</span>
                        <ArrowRight className="ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}
