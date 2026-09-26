/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  where,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from './firebaseAuth';
import { useState, useEffect, useCallback } from 'react';

export interface LineProductivityMetric {
  id: string;
  lineNo: string;
  style: string;
  buyer: string;
  date: string;
  floor: string;
  targetHourly: number;
  targetDay: number;
  actualOutput: number;
  efficiencyPct: number;
  targetEfficiencyPct: number;
  smv: number;
  operatorPresent: number;
  helperPresent: number;
  totalManpower: number;
  bottleneckStation: string;
  bottleneckCT: number;
  targetCT: number;
  status: 'running' | 'delayed' | 'critical' | 'stopped' | 'setup';
  updatedBy: string;
  updatedAt: string;
}

export interface LineProductivitySummary {
  totalLines: number;
  totalTargetDay: number;
  totalActualOutput: number;
  averageEfficiency: number;
  totalManpower: number;
  criticalLinesCount: number;
  runningLinesCount: number;
  lastUpdated: string;
}

/**
 * Calculates high-level floor productivity summary from an array of metrics.
 */
export function calculateProductivitySummary(metrics: LineProductivityMetric[]): LineProductivitySummary {
  if (!metrics || metrics.length === 0) {
    return {
      totalLines: 0,
      totalTargetDay: 0,
      totalActualOutput: 0,
      averageEfficiency: 0,
      totalManpower: 0,
      criticalLinesCount: 0,
      runningLinesCount: 0,
      lastUpdated: new Date().toISOString()
    };
  }

  const totalLines = metrics.length;
  const totalTargetDay = metrics.reduce((acc, m) => acc + (Number(m.targetDay) || 0), 0);
  const totalActualOutput = metrics.reduce((acc, m) => acc + (Number(m.actualOutput) || 0), 0);
  const totalEff = metrics.reduce((acc, m) => acc + (Number(m.efficiencyPct) || 0), 0);
  const averageEfficiency = totalLines > 0 ? parseFloat((totalEff / totalLines).toFixed(1)) : 0;
  const totalManpower = metrics.reduce((acc, m) => acc + (Number(m.totalManpower) || 0), 0);
  const criticalLinesCount = metrics.filter(m => m.status === 'critical' || m.status === 'delayed').length;
  const runningLinesCount = metrics.filter(m => m.status === 'running').length;

  return {
    totalLines,
    totalTargetDay,
    totalActualOutput,
    averageEfficiency,
    totalManpower,
    criticalLinesCount,
    runningLinesCount,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Fetches all line productivity metrics from the Firestore 'line_entries' collection.
 * Optionally filters by date (YYYY-MM-DD).
 */
export async function fetchLineProductivityMetrics(
  filterDate?: string
): Promise<{ metrics: LineProductivityMetric[]; summary: LineProductivitySummary }> {
  const collectionPath = 'line_entries';

  try {
    const colRef = collection(db, collectionPath);
    const q = filterDate ? query(colRef, where('date', '==', filterDate)) : query(colRef);
    const snapshot = await getDocs(q);

    const metrics: LineProductivityMetric[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      metrics.push({
        id: docSnap.id,
        lineNo: data.lineNo || docSnap.id,
        style: data.style || 'Standard Garment',
        buyer: data.buyer || 'Direct Order',
        date: data.date || filterDate || new Date().toISOString().split('T')[0],
        floor: data.floor || 'Floor 1',
        targetHourly: Number(data.targetHourly) || 0,
        targetDay: Number(data.targetDay) || 0,
        actualOutput: Number(data.actualOutput) || 0,
        efficiencyPct: Number(data.efficiencyPct) || 0,
        targetEfficiencyPct: Number(data.targetEfficiencyPct) || 75,
        smv: Number(data.smv) || 18.5,
        operatorPresent: Number(data.operatorPresent) || 0,
        helperPresent: Number(data.helperPresent) || 0,
        totalManpower: Number(data.totalManpower) || 0,
        bottleneckStation: data.bottleneckStation || 'None Detected',
        bottleneckCT: Number(data.bottleneckCT) || 0,
        targetCT: Number(data.targetCT) || 0,
        status: data.status || 'running',
        updatedBy: data.updatedBy || 'system',
        updatedAt: data.updatedAt || new Date().toISOString()
      });
    });

    // Sort by lineNo naturally (e.g. Line 01, Line 02)
    metrics.sort((a, b) => a.lineNo.localeCompare(b.lineNo, undefined, { numeric: true }));

    const summary = calculateProductivitySummary(metrics);
    return { metrics, summary };
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, collectionPath);
    } catch {
      // Handled and logged by handleFirestoreError
    }
    return { metrics: [], summary: calculateProductivitySummary([]) };
  }
}

/**
 * Fetches single line productivity metric document by ID.
 */
export async function fetchSingleLineProductivityMetric(
  lineId: string
): Promise<LineProductivityMetric | null> {
  const docPath = `line_entries/${lineId}`;
  try {
    const docRef = doc(db, 'line_entries', lineId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      id: snap.id,
      lineNo: data.lineNo || snap.id,
      style: data.style || '',
      buyer: data.buyer || '',
      date: data.date || '',
      floor: data.floor || '',
      targetHourly: Number(data.targetHourly) || 0,
      targetDay: Number(data.targetDay) || 0,
      actualOutput: Number(data.actualOutput) || 0,
      efficiencyPct: Number(data.efficiencyPct) || 0,
      targetEfficiencyPct: Number(data.targetEfficiencyPct) || 0,
      smv: Number(data.smv) || 0,
      operatorPresent: Number(data.operatorPresent) || 0,
      helperPresent: Number(data.helperPresent) || 0,
      totalManpower: Number(data.totalManpower) || 0,
      bottleneckStation: data.bottleneckStation || '',
      bottleneckCT: Number(data.bottleneckCT) || 0,
      targetCT: Number(data.targetCT) || 0,
      status: data.status || 'running',
      updatedBy: data.updatedBy || '',
      updatedAt: data.updatedAt || ''
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, docPath);
    return null;
  }
}

/**
 * Saves or updates a line productivity metric record in Firestore.
 */
export async function saveLineProductivityMetric(
  metric: LineProductivityMetric
): Promise<void> {
  const docPath = `line_entries/${metric.id}`;
  try {
    const docRef = doc(db, 'line_entries', metric.id);
    await setDoc(
      docRef,
      {
        ...metric,
        updatedBy: auth.currentUser?.uid || 'user',
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

/**
 * Subscribes to real-time updates for line productivity metrics.
 */
export function subscribeToLineProductivityMetrics(
  onData: (metrics: LineProductivityMetric[], summary: LineProductivitySummary) => void,
  onError?: (err: Error) => void,
  filterDate?: string
): Unsubscribe {
  const collectionPath = 'line_entries';
  const colRef = collection(db, collectionPath);
  const q = filterDate ? query(colRef, where('date', '==', filterDate)) : query(colRef);

  return onSnapshot(
    q,
    snapshot => {
      const metrics: LineProductivityMetric[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        metrics.push({
          id: docSnap.id,
          lineNo: data.lineNo || docSnap.id,
          style: data.style || 'Standard Garment',
          buyer: data.buyer || 'Direct Order',
          date: data.date || filterDate || new Date().toISOString().split('T')[0],
          floor: data.floor || 'Floor 1',
          targetHourly: Number(data.targetHourly) || 0,
          targetDay: Number(data.targetDay) || 0,
          actualOutput: Number(data.actualOutput) || 0,
          efficiencyPct: Number(data.efficiencyPct) || 0,
          targetEfficiencyPct: Number(data.targetEfficiencyPct) || 75,
          smv: Number(data.smv) || 18.5,
          operatorPresent: Number(data.operatorPresent) || 0,
          helperPresent: Number(data.helperPresent) || 0,
          totalManpower: Number(data.totalManpower) || 0,
          bottleneckStation: data.bottleneckStation || 'None Detected',
          bottleneckCT: Number(data.bottleneckCT) || 0,
          targetCT: Number(data.targetCT) || 0,
          status: data.status || 'running',
          updatedBy: data.updatedBy || 'system',
          updatedAt: data.updatedAt || new Date().toISOString()
        });
      });

      metrics.sort((a, b) => a.lineNo.localeCompare(b.lineNo, undefined, { numeric: true }));
      const summary = calculateProductivitySummary(metrics);
      onData(metrics, summary);
    },
    error => {
      let formattedErr: Error;
      try {
        handleFirestoreError(error, OperationType.GET, collectionPath);
        formattedErr = error instanceof Error ? error : new Error(String(error));
      } catch (err: any) {
        formattedErr = err instanceof Error ? err : new Error(String(err));
      }
      if (onError) {
        onError(formattedErr);
      }
    }
  );
}

/**
 * React hook for consuming real-time line productivity metrics.
 */
export function useLineProductivityMetrics(filterDate?: string) {
  const [metrics, setMetrics] = useState<LineProductivityMetric[]>([]);
  const [summary, setSummary] = useState<LineProductivitySummary>(calculateProductivitySummary([]));
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchLineProductivityMetrics(filterDate);
      setMetrics(result.metrics);
      setSummary(result.summary);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch line productivity metrics');
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    setLoading(true);

    try {
      unsubscribe = subscribeToLineProductivityMetrics(
        (data, sum) => {
          setMetrics(data);
          setSummary(sum);
          setLoading(false);
          setError(null);
        },
        err => {
          setError(err.message);
          setLoading(false);
        },
        filterDate
      );
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize listener');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [filterDate]);

  return {
    metrics,
    summary,
    loading,
    error,
    refetch,
    saveMetric: saveLineProductivityMetric
  };
}
