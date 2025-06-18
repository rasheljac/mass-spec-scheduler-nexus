
import React from "react";
import { Badge } from "../ui/badge";
import { useOptimizedBooking } from "../../contexts/OptimizedBookingContext";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = "" }) => {
  const { getStatusColor } = useOptimizedBooking();
  
  const formatStatusName = (status: string) => {
    return status.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  const statusColor = getStatusColor(status);

  return (
    <Badge 
      style={{ 
        backgroundColor: statusColor, 
        color: '#fff',
        border: 'none'
      }}
      className={`text-xs ${className}`}
    >
      {formatStatusName(status)}
    </Badge>
  );
};

export default StatusBadge;
