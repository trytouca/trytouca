// Copyright 2023 Touca, Inc. Subject to Apache-2.0 License.

import { AboveTheFold, ATFScreenshot } from '@/components/AboveTheFold';
import Announcement from '@/components/Announcement';
import FeatureAnalytics from '@/components/FeatureAnalytics';
import FeatureAutomate from '@/components/FeatureAutomate';
import FeatureCollaborate from '@/components/FeatureCollaborate';
import FeatureDiff from '@/components/FeatureDiff';
import FeatureSubmit from '@/components/FeatureSubmit';
import FeatureTestimonials from '@/components/FeatureTestimonials';
import OneLinerPitch from '@/components/OneLinerPitch';

export default function Home() {
  return (
    <main>
      <AboveTheFold />
      <ATFScreenshot />
      <Announcement />
      <OneLinerPitch />
      <FeatureTestimonials />
      <FeatureDiff />
      <FeatureSubmit />
      <FeatureAutomate />
      <FeatureAnalytics />
      <FeatureCollaborate />
    </main>
  );
}
