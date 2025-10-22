"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";

/**
 * DEV ONLY: Button to simulate campaign send without actually sending emails
 * 
 * This component should only be rendered in development mode.
 * It triggers the /api/dev/simulate-send endpoint to generate mock
 * email events and analytics data.
 * 
 * Usage:
 * ```tsx
 * {process.env.NODE_ENV === 'development' && (
 *   <SimulateSendButton campaignId={campaign.id} />
 * )}
 * ```
 */

interface SimulateSendButtonProps {
  campaignId: number | string;
  onSuccess?: () => void;
}

export function SimulateSendButton({ campaignId, onSuccess }: SimulateSendButtonProps) {
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async () => {
    setIsSimulating(true);
    
    try {
      const response = await fetch(`/api/dev/simulate-send?campaignId=${campaignId}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to simulate send');
      }
      
      // Show success toast with summary
      toast.success('Campaign send simulated!', {
        description: (
          <div className="text-sm space-y-1">
            <p>📨 Sent to {data.summary.totalRecipients} recipients</p>
            <p>📬 Delivered: {data.summary.delivered} ({data.summary.rates.delivery})</p>
            <p>👀 Opened: {data.summary.opened} ({data.summary.rates.open})</p>
            <p>🖱️ Clicked: {data.summary.clicked} ({data.summary.rates.click})</p>
          </div>
        ),
        duration: 5000,
      });
      
      // Call success callback if provided
      onSuccess?.();
      
    } catch (error) {
      console.error('Failed to simulate send:', error);
      toast.error('Failed to simulate send', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <Button
      onClick={handleSimulate}
      disabled={isSimulating}
      variant="outline"
      className="border-orange-500/50 text-orange-500 hover:bg-orange-500/10"
    >
      {isSimulating ? (
        <>
          <span className="mr-2">🔄</span>
          Simulating...
        </>
      ) : (
        <>
          <span className="mr-2">🎭</span>
          Simulate Send (Dev)
        </>
      )}
    </Button>
  );
}

/**
 * Alternative: Inline simulation trigger with statistics display
 */
interface SimulateSendCardProps {
  campaignId: number | string;
  onSuccess?: () => void;
}

export function SimulateSendCard({ campaignId, onSuccess }: SimulateSendCardProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);

  const handleSimulate = async () => {
    setIsSimulating(true);
    
    try {
      const response = await fetch(`/api/dev/simulate-send?campaignId=${campaignId}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to simulate send');
      }
      
      setLastResult(data.summary);
      toast.success('Campaign send simulated successfully!');
      onSuccess?.();
      
    } catch (error) {
      console.error('Failed to simulate send:', error);
      toast.error('Failed to simulate send', {
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="border border-orange-500/30 rounded-lg p-6 bg-orange-500/5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-orange-500 flex items-center gap-2">
            <span>🧪</span>
            Development Testing Mode
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Simulate campaign send without actually sending emails
          </p>
        </div>
      </div>

      {lastResult && (
        <div className="mb-4 p-4 bg-background rounded-md border">
          <h4 className="text-sm font-medium mb-2">Last Simulation Results</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Recipients:</span>
              <span className="ml-2 font-medium">{lastResult.totalRecipients}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Delivery Rate:</span>
              <span className="ml-2 font-medium">{lastResult.rates.delivery}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Open Rate:</span>
              <span className="ml-2 font-medium">{lastResult.rates.open}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Click Rate:</span>
              <span className="ml-2 font-medium">{lastResult.rates.click}</span>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={handleSimulate}
        disabled={isSimulating}
        className="w-full"
        variant="outline"
      >
        {isSimulating ? 'Simulating Send...' : 'Simulate Campaign Send'}
      </Button>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        This will generate mock analytics data without sending real emails
      </p>
    </div>
  );
}
