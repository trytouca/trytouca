// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.
'use client';

import { useEffect, useState } from 'react';

export default function LocalTime({ date: stamp }: { date: number }) {
  const [formattedDate, setEventDate] = useState<string | undefined>();

  useEffect(
    () =>
      setEventDate(
        new Intl.DateTimeFormat('en-US', {
          hour: 'numeric',
          minute: 'numeric',
          timeZone: 'America/Los_Angeles',
          timeZoneName: 'short'
        }).format(stamp)
      ),
    [stamp]
  );

  return formattedDate ? <span>{formattedDate}</span> : null;
}
