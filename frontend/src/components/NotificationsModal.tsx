import React from "react";
import { Bell, XCircle } from "lucide-react";
import { clientDb } from "../clientDb";

interface NotificationsModalProps {
  notifications: any[];
  onClose: () => void;
  onRefresh: () => void;
}

export default function NotificationsModal({ notifications, onClose, onRefresh }: NotificationsModalProps) {
  const handleMarkRead = (notifId: string) => {
    const notifs = clientDb.getNotifications();
    const found = notifs.find((n) => n.id === notifId);
    if (found) {
      found.read = true;
      clientDb.setNotifications(notifs);
    }
    onRefresh();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50">
      <div className="h-full w-96 border-l border-gray-200 bg-white p-6 shadow-2xl space-y-4 text-left flex flex-col justify-between">
        <div className="space-y-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold">
              <Bell className="h-4 w-4" />
              <span className="font-display text-sm uppercase tracking-wider">Unread Activity Notifications</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 rounded-full p-1 cursor-pointer">
              <XCircle className="h-5 w-5" />
            </button>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">No active notices.</div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border text-xs space-y-1 ${
                    notif.read ? "bg-slate-50 border-gray-150" : "bg-blue-50/50 border-blue-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="block font-bold text-gray-900">{notif.title}</span>
                    {!notif.read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="text-[9px] font-bold text-blue-900 hover:underline"
                      >
                        Read
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{notif.message}</p>
                  <span className="block text-[8px] text-gray-400 text-right">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 rounded py-2 text-xs font-semibold"
        >
          Close Panel
        </button>
      </div>
    </div>
  );
}
