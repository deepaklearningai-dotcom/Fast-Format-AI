import React from 'react';

export interface TranslationResult {
  email: string;
  sms: string;
  whatsapp: string;
}

export interface ResultCardProps {
  title: string;
  content: string;
  icon: React.ReactNode;
  colorClass: string;
  isLoading: boolean;
  delay: number;
}