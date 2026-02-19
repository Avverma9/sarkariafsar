import { buildMetadata } from "../../lib/seo";

export const metadata = buildMetadata({
  title: "Salary and Pay Scale Guide",
  description:
    "Understand pay levels, allowances, deductions, and in-hand salary basics for government jobs.",
  path: "/guides/salary-info",
  type: "Article",
  keywords: ["pay scale guide", "government salary", "in hand salary calculation"],
});

export default function SalaryInfo() {
  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <header className="space-y-3">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Salary & Pay Scale Basics
          </h1>
          <p className="text-sm text-slate-700 leading-relaxed">
            Government job salary looks simple from outside, but the actual pay
            structure includes multiple components like Pay Level, Basic Pay,
            Dearness Allowance (DA), House Rent Allowance (HRA), Transport
            Allowance (TA), and deductions like NPS and PF. Many candidates make
            wrong assumptions by only reading “Salary ₹35,000” written on
            unofficial websites. That is why understanding pay scale basics is
            extremely important before applying for any government recruitment.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            1. What is Pay Scale in Government Jobs?
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            In government jobs, salary is not decided randomly. It follows a
            structured pay scale system. Earlier, salary used to be calculated
            with “Pay Band + Grade Pay” (6th Pay Commission system). But now, in
            most central government jobs and many state jobs, salary is
            calculated using the “Pay Matrix” system introduced in the 7th Pay
            Commission.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Pay scale is basically a fixed salary range for a post. This range
            grows as your experience increases and annual increments are added.
            For example, a post may have a pay level where basic pay starts from
            ₹25,500 and can go up to ₹81,100. This means the salary is not fixed
            for everyone. A newly joined employee will start at the minimum
            basic pay, while a senior employee will be earning more.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            2. Pay Level and Pay Matrix Explained
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Pay Level is the most important term in modern government salary
            structure. Pay levels are numbered like Level 1, Level 2, Level 3,
            Level 4, Level 5, and so on. Higher pay level means higher salary,
            higher responsibilities, and usually better promotion scope.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Each pay level contains multiple salary stages. These stages show
            how salary increases after each year of service. When you join a
            government job, your salary begins at the first stage of that pay
            level. Every year, you get an increment and your basic pay moves to
            the next stage in the matrix.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Example: If you are selected for a Level 4 post, your basic pay may
            start at ₹25,500. After one year, it increases to the next stage,
            and so on. Over time, your pay becomes significantly higher.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            3. Basic Pay: The Foundation of Your Salary
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Basic Pay is the main component of your salary. It is the amount on
            which all allowances are calculated. Many candidates misunderstand
            salary because they focus on “gross pay” or “in-hand salary” without
            knowing the role of basic pay.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            The basic pay is fixed according to the pay level and your joining
            stage. For most government posts, you always join at the minimum
            basic pay unless you have prior government service.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Basic pay is important because DA and HRA are calculated as a
            percentage of basic pay. So, even a small increase in basic pay
            results in an increase in overall salary.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            4. Dearness Allowance (DA)
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            DA stands for Dearness Allowance. It is provided to government
            employees to reduce the impact of inflation. DA is revised by the
            government periodically, usually twice a year. This is one of the
            biggest benefits of government jobs because your salary automatically
            increases as inflation rises.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            DA is calculated as a percentage of basic pay. For example, if your
            basic pay is ₹25,500 and DA is 50%, then DA amount will be ₹12,750.
            This DA is added to your salary.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Because DA changes regularly, the take-home salary of government
            employees also changes. That is why the exact salary must always be
            verified from the latest official notification or government DA
            update.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            5. House Rent Allowance (HRA)
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            HRA stands for House Rent Allowance. It is given to employees to
            help cover accommodation costs. HRA depends on the city category
            where you are posted. Usually, cities are categorized as X, Y, and Z
            (or sometimes Tier-1, Tier-2, Tier-3). Big metro cities provide
            higher HRA compared to smaller towns.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Example: If your post is in a metro city like Delhi, Mumbai, or
            Bangalore, your HRA will be higher. If your post is in a rural area,
            HRA will be lower. Some departments also provide government quarters,
            and if you get official quarters, HRA may not be given.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            HRA is also calculated as a percentage of basic pay. That is why
            candidates should not compare salary without knowing the posting
            location.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            6. Transport Allowance (TA)
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Transport Allowance is provided to cover commuting expenses from
            home to office. TA depends on pay level and city category. Some
            departments provide higher TA in metro cities. Along with TA, you
            also get DA on TA (which means DA is applied to the transport
            allowance amount too).
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            For many entry-level posts like clerks or assistants, TA may look
            small, but it adds a significant amount to the gross salary.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            7. Other Common Allowances
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Apart from DA, HRA, and TA, government employees may receive other
            allowances depending on department and job type. Some common
            allowances include:
          </p>

          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
            <li>
              <span className="font-semibold">Medical Allowance:</span> Some
              departments provide medical reimbursement or fixed medical
              allowance.
            </li>
            <li>
              <span className="font-semibold">Risk Allowance:</span> Given in
              certain risky job roles like defense or paramilitary services.
            </li>
            <li>
              <span className="font-semibold">Special Duty Allowance:</span>{" "}
              Given in hard posting areas.
            </li>
            <li>
              <span className="font-semibold">Night Shift Allowance:</span>{" "}
              Given in posts requiring shift duty.
            </li>
            <li>
              <span className="font-semibold">Uniform Allowance:</span> Common in
              police, railways, and defense-related jobs.
            </li>
          </ul>

          <p className="text-sm text-slate-700 leading-relaxed">
            Not every post includes all allowances. That is why reading the
            official salary section in the notification is necessary.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            8. Gross Salary vs In-Hand Salary
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Many candidates get confused between gross salary and in-hand
            salary. Gross salary is the total salary including all allowances
            before deductions. In-hand salary (or take-home salary) is what you
            actually receive in your bank account after deductions.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Example: If a job advertises salary as ₹45,000 per month, it may be
            gross salary. But after deductions like NPS, PF, CGHS, income tax,
            and professional tax, the in-hand salary might become ₹38,000 or
            ₹40,000 depending on deductions.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            That is why you should always ask: is this salary gross or in-hand?
            Many YouTube videos show inflated numbers without explaining
            deductions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            9. Common Salary Deductions
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Deductions are a normal part of government salary. These deductions
            may look like a loss, but many of them are long-term benefits. Some
            common deductions include:
          </p>

          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
            <li>
              <span className="font-semibold">NPS (National Pension Scheme):</span>{" "}
              A percentage of your salary is deducted for retirement pension.
            </li>
            <li>
              <span className="font-semibold">Provident Fund (PF):</span> Some
              jobs have PF contribution.
            </li>
            <li>
              <span className="font-semibold">CGHS / Medical Contribution:</span>{" "}
              Government health scheme deduction.
            </li>
            <li>
              <span className="font-semibold">Income Tax:</span> Depends on your
              annual income and tax slab.
            </li>
            <li>
              <span className="font-semibold">Professional Tax:</span> Applicable
              in some states.
            </li>
          </ul>

          <p className="text-sm text-slate-700 leading-relaxed">
            After these deductions, you receive the net salary. But the deducted
            amount often returns to you as pension, medical support, and savings.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            10. Promotion and Increment Benefits
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Government jobs offer stable annual increments. Every year, your
            basic pay increases according to the pay matrix. This is one of the
            strongest long-term benefits because your salary grows even if you
            remain in the same post.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Promotions further increase your pay level. When you get promoted,
            your pay level upgrades, and your salary jumps significantly. Some
            departments also have departmental exams for faster promotion.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Over 10 to 15 years, salary growth in government jobs becomes strong
            because of DA hikes, increments, and promotions combined.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            11. Why You Must Always Verify Salary from Notification
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            Salary varies from post to post, department to department, and even
            state to state. Some recruitments mention “Pay Level + Allowances”
            while some mention only “Basic Pay”. Some posts also have probation
            period salary, where you receive reduced pay for the first year.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            That is why the official recruitment notification is the only
            trustworthy source. Always read the salary section carefully and
            check pay level, allowances, and deductions. If the notification
            mentions “as per 7th CPC”, then your salary will follow pay matrix
            rules.
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            Also, note that allowances like DA and HRA can change anytime
            depending on government policy. So your actual in-hand salary may
            differ from what is mentioned in old salary charts.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-bold text-slate-900">
            12. Final Summary (Simple Checklist)
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            If you want to understand government job salary properly, always
            follow this simple checklist:
          </p>

          <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
            <li>Check Pay Level and Basic Pay.</li>
            <li>Confirm DA percentage and latest update.</li>
            <li>Verify HRA based on city category.</li>
            <li>Check TA and additional allowances.</li>
            <li>Understand deductions like NPS, PF, and tax.</li>
            <li>Estimate gross salary and take-home salary separately.</li>
            <li>Confirm promotion and increment structure.</li>
            <li>Always trust official notification for final salary details.</li>
          </ul>

          <p className="text-sm text-slate-700 leading-relaxed">
            Understanding salary basics helps you choose the right post, plan
            your career, and avoid misinformation. Government jobs are valuable
            not only because of monthly salary but also because of long-term
            benefits like stability, increments, pension schemes, medical
            support, and promotion growth. If you compare jobs properly using
            pay level and allowances, you can make smarter career decisions and
            stay more confident during your preparation journey.
          </p>
        </section>
      </div>
    </div>
  );
}
