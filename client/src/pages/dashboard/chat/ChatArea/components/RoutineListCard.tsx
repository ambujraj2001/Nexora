import React from 'react';
import { Card, List, Tag } from 'antd';
import { SyncOutlined, ClockCircleOutlined } from '@ant-design/icons';

interface Routine {
  id: string;
  name: string;
  instruction: string;
  cron_expression: string;
  is_active: boolean;
  last_run?: string;
}

interface RoutineListCardProps {
  data: Routine[];
}

const RoutineListCard: React.FC<RoutineListCardProps> = ({ data }) => {
  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <SyncOutlined className="text-primary" />
          <span>AI Routines</span>
        </div>
      }
      className="w-full shadow-sm border-slate-100 dark:border-slate-800 dark:bg-slate-900/50"
      styles={{ body: { padding: '0 12px 12px 12px' } }}
    >
      <List
        dataSource={data}
        renderItem={(item) => (
          <List.Item className="border-b border-slate-50 dark:border-slate-800/50 py-3 last:border-0">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                <Tag color={item.is_active ? 'processing' : 'default'} className="rounded-full text-[10px] uppercase font-bold">
                  {item.is_active ? 'Active' : 'Paused'}
                </Tag>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                <ClockCircleOutlined />
                <span>Schedule: {item.cron_expression}</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0 mt-1 italic">
                "{item.instruction}"
              </p>
              {item.last_run && (
                <span className="text-[9px] text-slate-400 mt-1">
                  Last run: {new Date(item.last_run).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              )}
            </div>
          </List.Item>
        )}
        locale={{ emptyText: <span className="text-slate-400 italic text-xs py-4 block">No routines found</span> }}
      />
    </Card>
  );
};

export default RoutineListCard;
