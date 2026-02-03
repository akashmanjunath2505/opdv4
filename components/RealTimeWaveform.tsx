import React, { useEffect, useRef } from 'react';

interface RealTimeWaveformProps {
    stream: MediaStream | null;
    isRecording: boolean;
    barColor?: string;
}

export const RealTimeWaveform: React.FC<RealTimeWaveformProps> = ({ stream, isRecording, barColor = '#8A63D2' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);


    useEffect(() => {
        if (!isRecording || !stream) {
            // Cleanup if stopped
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
            }
            audioContextRef.current = null;
            analyserRef.current = null;
            sourceRef.current = null;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            // Clear canvas
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            return;
        }

        const initAudio = async () => {
            // 1. Create Audio Context
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass();
            audioContextRef.current = audioCtx;

            // 2. Create Analyser
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256; // Controls bar count (frequencyBinCount = fftSize / 2)
            analyser.smoothingTimeConstant = 0.5; // Smooth transitions
            analyserRef.current = analyser;

            // 3. Create Source
            try {
                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);
                sourceRef.current = source;
            } catch (err) {
                console.error("Error creating media stream source:", err);
                return;
            }

            draw();
        };

        const draw = () => {
            if (!analyserRef.current || !canvasRef.current) return;

            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const bufferLength = analyserRef.current.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const renderFrame = () => {
                animationFrameRef.current = requestAnimationFrame(renderFrame);

                analyserRef.current!.getByteFrequencyData(dataArray);
                // Alternatively use getByteTimeDomainData for waveform, but frequency (bars) usually looks better for voice.
                // Let's stick to bars like voice memos.

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const width = canvas.width;
                const height = canvas.height;
                const barWidth = (width / bufferLength) * 2.5;
                let barHeight;
                let x = 0;

                // Center the bars vertically or bottom align?
                // Voice memo style is usually mirrored around the x-axis or just spikes.
                // Let's do a simple symmetric wave from center.

                for (let i = 0; i < bufferLength; i++) {
                    barHeight = dataArray[i] / 2; // Scale down

                    // Dynamic color based on height or fixed
                    ctx.fillStyle = barColor;

                    // Draw centered bar
                    // Center Y is height / 2
                    // Bar extends up and down from center

                    const y = (height - barHeight) / 2;

                    // Curved aesthetic: rounded caps
                    // ctx.beginPath();
                    // ctx.roundRect(x, y, barWidth, barHeight, 5); // Needs newer browser support
                    // ctx.fill();

                    // Simple rect for compatibility
                    ctx.fillRect(x, y, barWidth, barHeight);

                    x += barWidth + 1;
                }
            };

            renderFrame();
        };

        initAudio();

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close().catch(e => console.error("Error closing audio context", e));
            }
        };

    }, [stream, isRecording, barColor]);

    return (
        <canvas
            ref={canvasRef}
            width={300}
            height={60}
            className="w-full h-full"
        />
    );
};
