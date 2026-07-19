import { useState } from "react";

const DB = "https://agrilogix-1bd06-default-rtdb.firebaseio.com";
const TERMS_VERSION = "1.0";

// ── Terms & Disclaimer Modal ───────────────────────────────────────────────────
export default function TermsModal({ tenantId, token, userId, onAccept }) {
  const [checked, setChecked] = useState(false);
  const [saving,  setSaving]  = useState(false);

  const accept = async () => {
    if (!checked) return;
    setSaving(true);
    try {
      await fetch(
        `${DB}/users/${userId}/termsAccepted.json?auth=${token}`,
        { method:"PUT", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({
            version:   TERMS_VERSION,
            acceptedAt: new Date().toISOString(),
            userId,
          })
        }
      );
      onAccept();
    } catch(e) { console.error("Terms save failed:", e); }
    setSaving(false);
  };

  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(8,18,8,0.94)",
      display:"flex",alignItems:"center",justifyContent:"center",
      zIndex:9500,fontFamily:"'Barlow',sans-serif",
    }}>
      <div style={{
        background:"#fff",borderRadius:14,width:"100%",maxWidth:680,
        maxHeight:"92vh",display:"flex",flexDirection:"column",
        boxShadow:"0 32px 80px rgba(0,0,0,0.5)",overflow:"hidden",
      }}>
        {/* Header */}
        <div style={{background:"#1a3612",padding:"20px 28px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>🌾</span>
            <span style={{fontFamily:"'Playfair Display',serif",fontSize:16,
              color:"#c8f0a8",letterSpacing:0.3}}>Agri Logix</span>
          </div>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,
            color:"#fff",marginTop:8}}>
            Terms of Use &amp; Disclaimer
          </div>
          <div style={{fontSize:11,color:"#8aaa60",marginTop:4}}>
            Version {TERMS_VERSION} — Please read carefully before continuing
          </div>
        </div>

        {/* Body */}
        <div style={{padding:"24px 32px",overflowY:"auto",flex:1,fontSize:13,
          color:"#1a3010",lineHeight:1.7}}>

          <p style={{marginTop:0,color:"#5a7a40",fontSize:12,fontStyle:"italic"}}>
            This Agreement is entered into between the user ("User") and Agri Logix
            ("Platform"), operated by Agri Logix Solutions. By accessing or using
            the Agri Logix platform, User agrees to be bound by the following terms
            and conditions.
          </p>

          <Section title="1. User-Entered Data &amp; Accuracy">
            The Agri Logix platform is a farm management and planning tool that
            relies exclusively on information entered by the User, including but not
            limited to field names, acreages, legal descriptions, crop history,
            yield data, expense rates, price elections, landlord information, and
            crop share percentages. Agri Logix makes no representation, warranty,
            or guarantee as to the accuracy, completeness, or fitness for any
            particular purpose of any data entered into the platform by the User.
            The User assumes full responsibility for the accuracy of all information
            entered and maintained within the platform.
          </Section>

          <Section title="2. Crop Insurance — No Guarantee of Claim Outcome">
            The Agri Logix platform may display calculations, projections, and
            estimates related to crop insurance, including but not limited to
            Actual Production History (APH) yields, price elections, coverage
            levels, projected revenue guarantees, and potential indemnity
            estimates. THE USER EXPRESSLY ACKNOWLEDGES AND AGREES THAT:
            <ul style={{marginTop:8,marginBottom:0,paddingLeft:20}}>
              <li style={{marginBottom:6}}>
                All crop insurance calculations, projections, and estimates
                displayed within the Agri Logix platform are for <strong>planning
                and informational purposes only</strong> and do not constitute a
                determination, confirmation, or guarantee of any crop insurance
                indemnity, claim, or coverage.
              </li>
              <li style={{marginBottom:6}}>
                No crop insurance claim is guaranteed or confirmed until formally
                verified, approved, and processed by the User's licensed crop
                insurance agent and the applicable insurance provider in
                accordance with all applicable federal, state, and policy-specific
                regulations.
              </li>
              <li style={{marginBottom:6}}>
                The triggering of a potential crop insurance claim, or the
                determination that production has fallen below a projected or
                guaranteed threshold, must be evaluated and certified solely by a
                licensed crop insurance agent and the insuring company. Agri Logix
                platform data does not constitute evidence of loss for purposes of
                any crop insurance claim.
              </li>
              <li style={{marginBottom:0}}>
                Users should consult with their licensed crop insurance agent for
                all matters related to coverage, claims, deadlines, reporting
                requirements, and policy interpretation.
              </li>
            </ul>
          </Section>

          <Section title="3. APH Data &amp; Imported Information">
            Actual Production History (APH) data imported into the Agri Logix
            platform is provided for planning purposes only. The User acknowledges
            that APH data is subject to annual review and certification by the
            Risk Management Agency (RMA) and the User's crop insurance provider.
            Imported APH data displayed within the platform may not reflect the
            most current certified APH on file with the User's insurance provider.
            Agri Logix assumes no responsibility for discrepancies between
            platform-displayed APH data and officially certified records.
          </Section>

          <Section title="4. Financial Projections &amp; Planning Estimates">
            All budget projections, income estimates, expense calculations, and
            profitability analyses generated by the Agri Logix platform are
            estimates based solely on User-entered data and are subject to
            significant variation due to weather, market conditions, yield
            variability, input cost changes, and other factors outside the
            control of Agri Logix. Such projections shall not be relied upon
            as the sole basis for financial, lending, or operational decisions.
            Users are encouraged to consult qualified agricultural lenders,
            financial advisors, and crop insurance agents before making
            significant financial decisions.
          </Section>

          <Section title="5. Limitation of Liability">
            TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, AGRI LOGIX,
            ITS OFFICERS, EMPLOYEES, AGENTS, AND AFFILIATES SHALL NOT BE LIABLE
            FOR ANY DIRECT, INDIRECT, INCIDENTAL, CONSEQUENTIAL, OR SPECIAL
            DAMAGES ARISING OUT OF OR IN CONNECTION WITH THE USE OF THE PLATFORM,
            INCLUDING BUT NOT LIMITED TO LOSSES ARISING FROM RELIANCE ON
            PLATFORM-GENERATED DATA, CALCULATIONS, OR PROJECTIONS, OR FROM
            ANY CROP INSURANCE CLAIM OUTCOME. THE USER'S USE OF THE PLATFORM
            IS AT THE USER'S SOLE RISK.
          </Section>

          <Section title="6. No Professional Advice">
            Nothing contained within the Agri Logix platform constitutes
            legal, financial, agronomic, or crop insurance advice. Agri Logix
            is a technology platform and is not a licensed crop insurance agent,
            financial advisor, or legal counsel. Users should seek qualified
            professional advice for all crop insurance, financial, and legal matters.
          </Section>

          <Section title="7. Data Privacy &amp; Security">
            User data entered into the Agri Logix platform is stored securely and
            is not shared with third parties without the User's consent, except
            as required by law. Agri Logix employs reasonable security measures
            to protect User data; however, no system is completely secure, and
            Agri Logix cannot guarantee the absolute security of User data.
          </Section>

          <Section title="8. Amendments">
            Agri Logix reserves the right to update or amend these Terms of Use
            at any time. Users will be notified of material changes and will be
            required to accept updated terms prior to continued use of the platform.
          </Section>

          <p style={{fontSize:12,color:"#7a9260",borderTop:"1px solid #e0edd0",
            paddingTop:16,marginBottom:0}}>
            By checking the box below and clicking "I Agree &amp; Continue," the User
            acknowledges that they have read, understood, and agree to be bound by
            these Terms of Use and Disclaimer in their entirety.
          </p>
        </div>

        {/* Footer */}
        <div style={{padding:"16px 32px",borderTop:"1px solid #e0edd0",
          background:"#f8fbf4",flexShrink:0}}>
          <label style={{display:"flex",alignItems:"flex-start",gap:12,
            cursor:"pointer",marginBottom:16}}>
            <input type="checkbox" checked={checked}
              onChange={e=>setChecked(e.target.checked)}
              style={{marginTop:3,accentColor:"#2a7a18",width:16,height:16,flexShrink:0}}/>
            <span style={{fontSize:13,color:"#1a3010",lineHeight:1.5}}>
              I have read, understood, and agree to the Agri Logix Terms of Use
              and Disclaimer, including the acknowledgment that all crop insurance
              projections are estimates only and are not a guarantee of any
              insurance claim outcome.
            </span>
          </label>
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button onClick={accept} disabled={!checked||saving} style={{
              background:checked?"#2a7a18":"#ccc",border:"none",borderRadius:7,
              padding:"11px 32px",fontSize:13,color:"#fff",fontWeight:700,
              cursor:checked?"pointer":"not-allowed",fontFamily:"'Barlow',sans-serif",
              transition:"background 0.2s",
            }}>
              {saving?"Saving…":"I Agree & Continue →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reusable section component ─────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{marginBottom:20}}>
      <div style={{fontWeight:700,color:"#1a3010",marginBottom:6,fontSize:13}}>
        {title}
      </div>
      <div style={{color:"#2a4020",lineHeight:1.7}}>{children}</div>
    </div>
  );
}
