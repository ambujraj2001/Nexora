import React from 'react';
import { Card, List, Tag } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';

interface AppItem {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface AppListCardProps {
  data: AppItem[];
}

const AppListCard: React.FC<AppListCardProps> = ({ data }) => {
  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <AppstoreOutlined className="text-primary" />
          <span>Apps</span>
        </div>
      }
      className="w-full shadow-sm border-slate-100 dark:border-border-dark dark:bg-card-dark/50"
      styles={{ body: { padding: '0 12px 12px 12px' } }}
    >
      <List
        dataSource={data}
        renderItem={(item) => (
          <List.Item className="border-b border-slate-50 dark:border-border-dark/50 py-3 last:border-0">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                <Tag color="cyan" className="rounded-full text-[10px] uppercase font-bold">
                  App
                </Tag>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0">
                {item.description}
              </p>
              <span className="text-[10px] text-slate-400 font-medium">
                Created: {new Date(item.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </div>
          </List.Item>
        )}
        locale={{ emptyText: <span className="text-slate-400 italic text-xs py-4 block">No apps found</span> }}
      />
    </Card>
  );
};

export default AppListCard;
