"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  retryOrderEmailJob,
  sendShipmentEmail,
} from "@/app/admin/orders/[orderId]/actions";
import StatusBadge from "@/features/admin/components/StatusBadge";

type EmailJob = {
  id: string;
  type: string;
  recipient: string;
  status: string;
  attempts: number;
  sentAt: string | null;
  lastError: string | null;
};

type ShipmentEmail = {
  recipient: string;
  sentAt: string | null;
  trackingCarrier: string | null;
  trackingNumber: string | null;
};

type Props = {
  orderId: string;
  jobs: EmailJob[];
  shipmentEmail: ShipmentEmail;
};

type ActionState = {
  error?: string;
  success?: boolean;
};

const initialState: ActionState = {};

function formatSentAt(value: string | null) {
  if (!value) return null;

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getJobSummary(job: EmailJob | undefined) {
  if (!job) {
    return {
      badgeStatus: "not_queued",
      meta: "No email job has been queued for this order yet.",
      canRetry: false,
    };
  }

  if (job.status === "sent") {
    return {
      badgeStatus: "email_sent",
      meta: `Sent ${formatSentAt(job.sentAt)}.`,
      canRetry: false,
    };
  }

  if (job.status === "failed") {
    return {
      badgeStatus: "email_failed",
      meta: `Attempts: ${job.attempts}.`,
      canRetry: true,
    };
  }

  if (job.status === "processing") {
    return {
      badgeStatus: "email_processing",
      meta: `Attempt ${job.attempts} is in progress.`,
      canRetry: false,
    };
  }

  return {
    badgeStatus: "email_pending",
    meta: job.attempts > 0 ? `Attempts: ${job.attempts}.` : "Queued and waiting to send.",
    canRetry: true,
  };
}

function getShipmentSummary(shipmentEmail: ShipmentEmail) {
  const hasTracking = Boolean(
    shipmentEmail.trackingCarrier?.trim() && shipmentEmail.trackingNumber?.trim()
  );

  if (shipmentEmail.sentAt) {
    return {
      badgeStatus: "email_sent",
      meta: `Sent ${formatSentAt(shipmentEmail.sentAt)}.`,
      helper: `Tracking: ${shipmentEmail.trackingCarrier} ${shipmentEmail.trackingNumber}`,
      canSend: true,
      buttonLabel: "Resend shipment email",
      requiresConfirmation: true,
    };
  }

  if (!hasTracking) {
    return {
      badgeStatus: "tracking_needed",
      meta: "Tracking information is required before this email can be sent.",
      helper: "Save both tracking carrier and tracking number first.",
      canSend: false,
      buttonLabel: "Send shipment email",
      requiresConfirmation: false,
    };
  }

  return {
    badgeStatus: "ready_to_send",
    meta: `Tracking ready: ${shipmentEmail.trackingCarrier} ${shipmentEmail.trackingNumber}`,
    helper: "This email will send the saved tracking information to the customer.",
    canSend: true,
    buttonLabel: "Send shipment email",
    requiresConfirmation: false,
  };
}

export default function OrderEmailJobs({
  orderId,
  jobs,
  shipmentEmail,
}: Props) {
  const [retryState, retryAction] = useActionState(retryOrderEmailJob, initialState);
  const [shipmentState, shipmentAction] = useActionState(
    sendShipmentEmail,
    initialState
  );

  const customerJob = jobs.find((job) => job.type === "order_confirmation");
  const internalJob = jobs.find((job) => job.type === "internal_new_order");
  const customerSummary = getJobSummary(customerJob);
  const internalSummary = getJobSummary(internalJob);
  const shipmentSummary = getShipmentSummary(shipmentEmail);

  return (
    <section>
      <p className="ui-body-sm">Order emails</p>

      <div className="mt-5 space-y-5">
        <EmailJobCard
          orderId={orderId}
          title="Customer confirmation"
          recipient={customerJob?.recipient ?? shipmentEmail.recipient}
          job={customerJob}
          summary={customerSummary}
          action={retryAction}
        />

        <EmailJobCard
          orderId={orderId}
          title="Internal notification"
          recipient={internalJob?.recipient ?? "Internal inbox"}
          job={internalJob}
          summary={internalSummary}
          action={retryAction}
        />

        <ShipmentEmailCard
          orderId={orderId}
          recipient={shipmentEmail.recipient}
          summary={shipmentSummary}
          action={shipmentAction}
        />
      </div>

      {retryState?.error ? (
        <p className="ui-body-sm-copy mt-4">{retryState.error}</p>
      ) : null}

      {retryState?.success ? (
        <p className="ui-body-sm-copy mt-4">Email job retried.</p>
      ) : null}

      {shipmentState?.error ? (
        <p className="ui-body-sm-copy mt-4">{shipmentState.error}</p>
      ) : null}

      {shipmentState?.success ? (
        <p className="ui-body-sm-copy mt-4">Shipment email sent.</p>
      ) : null}
    </section>
  );
}

function EmailJobCard({
  orderId,
  title,
  recipient,
  job,
  summary,
  action,
}: {
  orderId: string;
  title: string;
  recipient: string;
  job: EmailJob | undefined;
  summary: ReturnType<typeof getJobSummary>;
  action: (formData: FormData) => void;
}) {
  return (
    <div className="border p-4" style={{ borderColor: "var(--color-border-soft)" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ui-body-sm">{title}</p>
          <p className="ui-caption-copy ui-muted mt-2 break-all">{recipient}</p>
        </div>

        <div className="shrink-0">
          <StatusBadge status={summary.badgeStatus} />
        </div>
      </div>

      <p className="ui-caption-copy ui-muted mt-3">{summary.meta}</p>

      {job?.lastError ? (
        <p className="ui-caption-copy mt-3">Last error: {job.lastError}</p>
      ) : null}

      {summary.canRetry && job ? (
        <form action={action} className="mt-4">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="emailJobId" value={job.id} />
          <RetryEmailButton />
        </form>
      ) : null}
    </div>
  );
}

function ShipmentEmailCard({
  orderId,
  recipient,
  summary,
  action,
}: {
  orderId: string;
  recipient: string;
  summary: ReturnType<typeof getShipmentSummary>;
  action: (formData: FormData) => void;
}) {
  return (
    <div className="border p-4" style={{ borderColor: "var(--color-border-soft)" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="ui-body-sm">Shipment update</p>
          <p className="ui-caption-copy ui-muted mt-2 break-all">{recipient}</p>
        </div>

        <div className="shrink-0">
          <StatusBadge status={summary.badgeStatus} />
        </div>
      </div>

      <p className="ui-caption-copy ui-muted mt-3">{summary.meta}</p>
      <p className="ui-caption-copy ui-subtle mt-3">{summary.helper}</p>

      <form action={action} className="mt-4">
        <input type="hidden" name="orderId" value={orderId} />
        <ShipmentEmailButton
          disabled={!summary.canSend}
          label={summary.buttonLabel}
          requiresConfirmation={summary.requiresConfirmation}
        />
      </form>
    </div>
  );
}

function RetryEmailButton() {
  return <SubmitButton pendingLabel="Retrying..." label="Retry email" />;
}

function ShipmentEmailButton({
  disabled,
  label,
  requiresConfirmation,
}: {
  disabled: boolean;
  label: string;
  requiresConfirmation: boolean;
}) {
  return (
    <SubmitButton
      pendingLabel="Sending..."
      label={label}
      disabled={disabled}
      confirmMessage={
        requiresConfirmation
          ? "Resend this shipment email to the customer?"
          : undefined
      }
    />
  );
}

function SubmitButton({
  pendingLabel,
  label,
  disabled = false,
  confirmMessage,
}: {
  pendingLabel: string;
  label: string;
  disabled?: boolean;
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="ui-button-sm"
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
