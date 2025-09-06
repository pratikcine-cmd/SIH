import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function Scan() {
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<{
    name: string;
    qty: string;
    kcal: number;
    tags: string[];
  } | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startCamera = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
    } catch (e) {
      setError(
        "Camera access denied or unavailable. You can still upload an image or enter a code.",
      );
      setCameraOn(false);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  };

  useEffect(() => () => stopCamera(), []);

  const scan = () => {
    // Mock: capture current frame (if camera on) to simulate a scan
    if (cameraOn && videoRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement("canvas");
      canvasRef.current = canvas;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      setFileName("camera-frame");
    }
    setResult({
      name: "Oats",
      qty: "100g",
      kcal: 389,
      tags: ["Warm", "Rasa: Madhura", "Light"],
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Barcode Scanner</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2 grid gap-2">
              <div className="flex items-center gap-2">
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Enter or paste barcode"
                />
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) =>
                    setFileName(e.target.files?.[0]?.name || null)
                  }
                />
              </div>
              <div className="rounded-md border p-3">
                <div className="mb-2 text-sm font-medium">Camera</div>
                {!cameraOn ? (
                  <Button size="sm" onClick={startCamera}>
                    Use Camera
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <video
                      ref={videoRef}
                      className="h-48 w-full rounded-md bg-black/60 object-cover"
                      muted
                      playsInline
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={scan}>
                        Capture & Scan (mock)
                      </Button>
                      <Button size="sm" variant="outline" onClick={stopCamera}>
                        Stop Camera
                      </Button>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="mt-2 text-xs text-destructive">{error}</div>
                )}
              </div>
            </div>
            <div className="flex items-start">
              <Button className="w-full" onClick={scan}>
                Scan (mock)
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">
                  {result.name} • {result.qty}
                </div>
                <div className="text-xs text-muted-foreground">
                  Calories: {result.kcal} • Source:{" "}
                  {fileName || (cameraOn ? "camera" : "mock") || code || "mock"}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {result.tags.map((t, i) => (
                  <Badge key={i} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
