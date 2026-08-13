import React from 'react';
import { IQACDeanPortal } from './IQACDeanPortal';

interface Props { user?: any }

export const IQACExecutivePortal: React.FC<Props> = ({ user }) => <IQACDeanPortal user={user} />;
