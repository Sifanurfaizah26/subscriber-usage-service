/**
 * In-memory Store for Subscribers and Usage Records
 * Pre-seeded with reference data matching the test specification.
 */

const INITIAL_SUBSCRIBERS = [
  { id: 'SUB01', name: 'Amir', plan: 'Basic', activationDate: '2023-01-12' },
  { id: 'SUB02', name: 'Sari', plan: 'Premium', activationDate: '2022-05-03' },
  { id: 'SUB03', name: 'Budi', plan: 'Basic', activationDate: '2024-09-20' },
  { id: 'SUB04', name: 'Dewi', plan: 'Family', activationDate: '2021-02-15' },
  { id: 'SUB05', name: 'Rian', plan: 'Premium', activationDate: '2023-08-08' },
  { id: 'SUB06', name: 'Nia', plan: 'Basic', activationDate: '2024-11-30' },
];

const INITIAL_USAGE_RECORDS = [
  { id: 1, subscriberId: 'SUB01', callMinutes: 40, smsCount: 10, dataUsageMB: 1500, timestamp: '2025-08-01T08:00:00.000Z' },
  { id: 2, subscriberId: 'SUB01', callMinutes: 35, smsCount: 8, dataUsageMB: 1200, timestamp: '2025-08-01T12:00:00.000Z' },
  { id: 3, subscriberId: 'SUB02', callMinutes: 90, smsCount: 20, dataUsageMB: 6000, timestamp: '2025-08-01T08:00:00.000Z' },
  { id: 4, subscriberId: 'SUB02', callMinutes: 85, smsCount: 18, dataUsageMB: 5800, timestamp: '2025-08-01T12:00:00.000Z' },
  { id: 5, subscriberId: 'SUB03', callMinutes: 20, smsCount: 5, dataUsageMB: 500, timestamp: '2025-08-01T08:00:00.000Z' },
  { id: 6, subscriberId: 'SUB04', callMinutes: 150, smsCount: 30, dataUsageMB: 9000, timestamp: '2025-08-01T08:00:00.000Z' },
  { id: 7, subscriberId: 'SUB05', callMinutes: 70, smsCount: 15, dataUsageMB: 5000, timestamp: '2025-08-01T08:00:00.000Z' },
  { id: 8, subscriberId: 'SUB06', callMinutes: 25, smsCount: 6, dataUsageMB: 700, timestamp: '2025-08-01T08:00:00.000Z' },
];

class MemoryStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.subscribers = JSON.parse(JSON.stringify(INITIAL_SUBSCRIBERS));
    this.usageRecords = JSON.parse(JSON.stringify(INITIAL_USAGE_RECORDS));
    this.nextRecordId = this.usageRecords.length + 1;
  }

  // --- Subscribers ---
  getAllSubscribers() {
    return [...this.subscribers];
  }

  findSubscriber(id) {
    if (!id) return null;
    return this.subscribers.find(s => s.id.toUpperCase() === id.toUpperCase()) || null;
  }

  addSubscriber({ id, name, plan, activationDate }) {
    const subscriberId = id || `SUB0${this.subscribers.length + 1}`;
    const newSub = {
      id: subscriberId,
      name: name.trim(),
      plan: plan || 'Basic',
      activationDate: activationDate || new Date().toISOString().split('T')[0]
    };
    this.subscribers.push(newSub);
    return newSub;
  }

  updateSubscriberPlan(id, newPlan) {
    const sub = this.findSubscriber(id);
    if (!sub) return null;
    sub.plan = newPlan;
    return sub;
  }

  // --- Usage Records ---
  recordUsage({ subscriberId, callMinutes, smsCount, dataUsageMB, timestamp }) {
    if (!subscriberId || typeof subscriberId !== 'string') {
      throw new Error('Field "subscriberId" is required and must be a string.');
    }

    const numCallMinutes = Number(callMinutes);
    if (isNaN(numCallMinutes) || numCallMinutes < 0) {
      throw new Error('Field "callMinutes" must be a non-negative number.');
    }

    const numSmsCount = Number(smsCount);
    if (isNaN(numSmsCount) || numSmsCount < 0 || !Number.isInteger(numSmsCount)) {
      throw new Error('Field "smsCount" must be a non-negative integer.');
    }

    const numDataUsageMB = Number(dataUsageMB);
    if (isNaN(numDataUsageMB) || numDataUsageMB < 0) {
      throw new Error('Field "dataUsageMB" must be a non-negative number.');
    }

    const record = {
      id: this.nextRecordId++,
      subscriberId: subscriberId.toUpperCase().trim(),
      callMinutes: numCallMinutes,
      smsCount: numSmsCount,
      dataUsageMB: numDataUsageMB,
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString()
    };

    this.usageRecords.push(record);
    return record;
  }

  getAllUsageRecords(filters = {}) {
    let results = [...this.usageRecords];

    if (filters.subscriberId) {
      const targetId = filters.subscriberId.toUpperCase().trim();
      results = results.filter(r => r.subscriberId === targetId);
    }

    if (filters.sortBy) {
      const field = filters.sortBy;
      const order = (filters.order || 'desc').toLowerCase() === 'asc' ? 1 : -1;
      results.sort((a, b) => {
        if (a[field] < b[field]) return -1 * order;
        if (a[field] > b[field]) return 1 * order;
        return 0;
      });
    } else {
      // Default order: newest first
      results.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    if (filters.limit) {
      const limitNum = parseInt(filters.limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        results = results.slice(0, limitNum);
      }
    }

    return results;
  }

  getSubscriberSummary(subscriberId) {
    const sub = this.findSubscriber(subscriberId);
    const targetId = subscriberId.toUpperCase().trim();
    const records = this.usageRecords.filter(r => r.subscriberId === targetId);

    const totalCallMinutes = records.reduce((sum, r) => sum + r.callMinutes, 0);
    const totalSmsCount = records.reduce((sum, r) => sum + r.smsCount, 0);
    const totalDataUsageMB = records.reduce((sum, r) => sum + r.dataUsageMB, 0);
    const avgCallMinutes = records.length ? Number((totalCallMinutes / records.length).toFixed(2)) : 0;

    return {
      subscriber: sub || { id: targetId, name: 'Unknown', plan: 'Unknown' },
      recordCount: records.length,
      totalCallMinutes,
      totalSmsCount,
      totalDataUsageMB,
      avgCallMinutesPerSnapshot: avgCallMinutes,
      records
    };
  }

  getOverallSummary() {
    const totalRecords = this.usageRecords.length;
    const totalCallMinutes = this.usageRecords.reduce((sum, r) => sum + r.callMinutes, 0);
    const totalSmsCount = this.usageRecords.reduce((sum, r) => sum + r.smsCount, 0);
    const totalDataUsageMB = this.usageRecords.reduce((sum, r) => sum + r.dataUsageMB, 0);

    const subscriberIds = new Set(this.usageRecords.map(r => r.subscriberId));

    return {
      totalRecords,
      uniqueSubscribersWithUsage: subscriberIds.size,
      totalSubscribersRegistered: this.subscribers.length,
      totalCallMinutes,
      totalSmsCount,
      totalDataUsageMB,
      averageDataPerRecordMB: totalRecords ? Number((totalDataUsageMB / totalRecords).toFixed(2)) : 0
    };
  }
}

const store = new MemoryStore();
module.exports = store;
