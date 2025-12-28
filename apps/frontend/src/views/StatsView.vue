<script setup lang="ts">
import { ref } from 'vue'
import Tabs from '@/components/ui/Tabs.vue'
import TabsList from '@/components/ui/TabsList.vue'
import TabsTrigger from '@/components/ui/TabsTrigger.vue'
import TabsContent from '@/components/ui/TabsContent.vue'
import FinancialTab from './stats/FinancialTab.vue'
import PaymentBehaviorTab from './stats/PaymentBehaviorTab.vue'

const activeTab = ref<'FINANCIAL' | 'BEHAVIOR'>('FINANCIAL')
</script>

<template>
  <div class="space-y-6">
   
    <Tabs v-model:model-value="activeTab" class="w-full">
      <div class="flex flex-col items-center">
        <TabsList class="grid w-full grid-cols-2 max-w-md mb-8">
          <TabsTrigger value="FINANCIAL">Laporan Keuangan</TabsTrigger>
          <TabsTrigger value="BEHAVIOR">Estimasi Pembayaran</TabsTrigger>
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
