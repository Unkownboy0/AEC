import React from 'react';
import { IQACDeanPortal } from './IQACDeanPortal';

interface IQACDocumentationPortalProps { user?: any }

// Documentation officers use the canonical, live Evidence Repository.
export const IQACDocumentationPortal: React.FC<IQACDocumentationPortalProps> = ({ user }) => <IQACDeanPortal user={user} />;
