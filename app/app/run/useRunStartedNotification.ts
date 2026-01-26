
import { toast } from "react-toastify";
import { useEffect, useRef } from "react";

export function useRunStartedNotification(runs) {
  const prevStatuses = useRef({});

  useEffect(() => {
    runs.forEach(run => {
      if (
        prevStatuses.current[run.id] !== "running" &&
        run.status === "running"
      ) {
        toast.info(`Run '${run.workflowName}' has started!`, {
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
      prevStatuses.current[run.id] = run.status;
    });
  }, [runs]);
}
