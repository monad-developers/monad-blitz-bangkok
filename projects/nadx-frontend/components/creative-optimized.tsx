'use client';

import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AnimatePresence, motion } from 'framer-motion';

// Components
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TabNavigation } from '@/components/layout/TabNavigation';
import { LazyTabs } from '@/components/LazyTabs';

// Hooks
import { useAppState } from '@/hooks/useAppState';

// Data
import { apps, communityPosts, projects, recentFiles, tutorials } from '@/data';

export function HomeComponent() {
  const { activeTab, setActiveTab } = useAppState();

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <motion.div
        className="absolute inset-0 -z-10 opacity-20"
        animate={{
          background: [
            'radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)',
            'radial-gradient(circle at 30% 70%, rgba(233, 30, 99, 0.5) 0%, rgba(81, 45, 168, 0.5) 50%, rgba(0, 0, 0, 0) 100%)',
            'radial-gradient(circle at 70% 30%, rgba(76, 175, 80, 0.5) 0%, rgba(32, 119, 188, 0.5) 50%, rgba(0, 0, 0, 0) 100%)',
            'radial-gradient(circle at 50% 50%, rgba(120, 41, 190, 0.5) 0%, rgba(53, 71, 125, 0.5) 50%, rgba(0, 0, 0, 0) 100%)',
          ],
        }}
        transition={{
          duration: 30,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'linear',
        }}
      />

      <div className="min-h-screen">
        <main className="flex-1 p-4 md:p-6">
          <Tabs
            defaultValue="trending"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value={activeTab} className="space-y-8 mt-0">
                  <ErrorBoundary>
                    <LazyTabs
                      activeTab={activeTab}
                      apps={apps}
                      recentFiles={recentFiles}
                      projects={projects}
                      tutorials={tutorials}
                      communityPosts={communityPosts}
                    />
                  </ErrorBoundary>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
