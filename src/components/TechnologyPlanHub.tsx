import React, { useState } from 'react';
import { BookOpen, Layers3 } from 'lucide-react';
import P1TechnologyPlan from './P1TechnologyPlan';
import PrimaryTechnologyPlans from './PrimaryTechnologyPlans';
import './TechnologyPlanHub.css';

type PlanView = 'p1-year' | 'primary-outcomes';

interface TechnologyPlanHubProps {
  initialView?: PlanView;
}

const TechnologyPlanHub: React.FC<TechnologyPlanHubProps> = ({ initialView = 'p1-year' }) => {
  const [view, setView] = useState<PlanView>(initialView);

  return (
    <div className="technology-plan-hub">
      <header className="technology-plan-hub__header">
        <div>
          <h2>แผนเทคโนโลยีและบันทึกหลังสอน</h2>
          <p>รวมแผนรายคาบ ป.1 และแผนตามผลลัพธ์การเรียนรู้ ป.1–6 ไว้ในหน้าเดียว</p>
        </div>
        <div className="technology-plan-hub__tabs" role="tablist" aria-label="เลือกชุดแผนการสอน">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'p1-year'}
            className={view === 'p1-year' ? 'active' : ''}
            onClick={() => setView('p1-year')}
          >
            <BookOpen size={17} /> แผนรายคาบ ป.1 และหลังสอน
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'primary-outcomes'}
            className={view === 'primary-outcomes' ? 'active' : ''}
            onClick={() => setView('primary-outcomes')}
          >
            <Layers3 size={17} /> แผนตามผลลัพธ์ ป.1–6
          </button>
        </div>
      </header>

      <div role="tabpanel">
        {view === 'p1-year' ? <P1TechnologyPlan /> : <PrimaryTechnologyPlans />}
      </div>
    </div>
  );
};

export default TechnologyPlanHub;
