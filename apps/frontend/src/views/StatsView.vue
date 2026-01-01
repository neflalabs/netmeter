<script setup lang="ts">
import { ref } from 'vue'
import Tabs from '@/components/ui/Tabs.vue'
import TabsList from '@/components/ui/TabsList.vue'
import TabsTrigger from '@/components/ui/TabsTrigger.vue'
import TabsContent from '@/components/ui/TabsContent.vue'
import FinancialTab from './stats/FinancialTab.vue'
import PaymentBehaviorTab from './stats/PaymentBehaviorTab.vue'

const activeTab = ref('FINANCIAL')
</script>

<template>
  <div class="space-y-8">
   
    <Tabs v-model="activeTab" class="w-full">
      <div class="flex flex-col items-center">
        <TabsList class="grid w-full grid-cols-2 max-w-md mb-8 p-1 bg-secondary/50 rounded-xl">
          <TabsTrigger value="FINANCIAL" class="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300">
            Laporan Keuangan
          </TabsTrigger>
          <TabsTrigger value="BEHAVIOR" class="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300">
            Estimasi Pembayaran
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="FINANCIAL" class="mt-0">
        <FinancialTab />
      </TabsContent>

      <TabsContent value="BEHAVIOR" class="mt-0">
        <PaymentBehaviorTab />
      </TabsContent>
    </Tabs>
  </div>
</template>
