async function loadResults() {
    try {
      const res = await fetch('/api/results');
      if (!res.ok) {
        throw new Error('Failed to fetch results');
      }
  
      const results = await res.json();
      const container = document.getElementById('results');
      if (!container) return;
  
      container.innerHTML = '';
  
      for (const test of results) {
        const card = document.createElement('div');
        card.style.border = "1px solid #ccc";
        card.style.padding = "10px";
        card.style.margin = "10px 0";
        card.style.borderRadius = "8px";
        card.style.background = "#f9f9f9";
        card.style.position = "relative"; // so children can be positioned easily
  
        const identity = document.createElement('h2');
        identity.textContent = test.identity;
        card.appendChild(identity);
  
        const sim = document.createElement('p');
        sim.textContent = `Simulation: ${test.simulationCalls} calls, ${test.simulationTokens} tokens`;
        card.appendChild(sim);
  
        const service = document.createElement('p');
        service.textContent = `Service Agent: ${test.serviceagentCalls} calls, ${test.serviceagentTokens} tokens`;
        card.appendChild(service);
  
        if (test.detectedRepetition) {
          const repetitionNotice = document.createElement('p');
          repetitionNotice.style.color = "red";
          repetitionNotice.style.fontWeight = "bold";
          repetitionNotice.textContent = `⚠️ Repetition detected in conversation`;
          card.appendChild(repetitionNotice);
        }
  
        const acList = document.createElement('ul');
        for (const ac of test.acceptance) {
          const item = document.createElement('li');
          item.textContent = `[${ac.passed ? "✅ PASSED" : "❌ FAILED"}] ${ac.alias}` +
            (ac.reason ? ` — ${ac.reason}` : '');
          acList.appendChild(item);
        }
        card.appendChild(acList);
  
        // Conversation toggle
        const conversationToggle = document.createElement('button');
        conversationToggle.textContent = "Show Conversation ▼";
        conversationToggle.style.marginTop = "10px";
        conversationToggle.style.padding = "5px 10px";
        conversationToggle.style.borderRadius = "5px";
        conversationToggle.style.border = "none";
        conversationToggle.style.backgroundColor = "#007BFF";
        conversationToggle.style.color = "white";
        conversationToggle.style.cursor = "pointer";
  
        card.appendChild(conversationToggle);
  
        const conversationDiv = document.createElement('div');
        conversationDiv.style.marginTop = "10px";
        conversationDiv.style.padding = "10px";
        conversationDiv.style.background = "#eef";
        conversationDiv.style.display = "none";
        conversationDiv.style.whiteSpace = "pre-wrap";
  
        if (test.conversation) {
          for (const message of test.conversation) {
            const p = document.createElement('p');
            p.innerHTML = `<strong>${message.role}:</strong> ${message.content}`;
            conversationDiv.appendChild(p);
          }
        }
        card.appendChild(conversationDiv);
  
        // Moderation Violations
        if (test.moderationViolations) {
          const moderationSection = document.createElement('div');
          moderationSection.style.marginTop = "10px";
          moderationSection.style.background = "#fee";
          moderationSection.style.padding = "10px";
          moderationSection.style.borderRadius = "8px";
  
          const modTitle = document.createElement('h4');
          modTitle.textContent = "Moderation Violations:";
          moderationSection.appendChild(modTitle);
  
          const anyFlagged = test.moderationViolations.some((mod: { flagged: boolean }) => mod.flagged);
          if (anyFlagged) {
            for (const mod of test.moderationViolations) {
              if (!mod.flagged) continue;
              const modItem = document.createElement('p');
              modItem.innerHTML = `<strong>${mod.role}:</strong> ${mod.content}<br/><em>Categories: ${JSON.stringify(mod.categories)}</em>`;
              moderationSection.appendChild(modItem);
            }
          } else {
            const noFlagged = document.createElement('p');
            noFlagged.textContent = "✅ No moderation flags detected.";
            moderationSection.appendChild(noFlagged);
          }
  
          card.appendChild(moderationSection);
        }
  
        // Button click controls conversation (not full card)
        conversationToggle.addEventListener('click', (event) => {
          event.stopPropagation();
          const isVisible = conversationDiv.style.display === 'block';
          conversationDiv.style.display = isVisible ? 'none' : 'block';
          conversationToggle.textContent = isVisible ? "Show Conversation ▼" : "Hide Conversation ▲";
        });
  
        container.appendChild(card);
      }
    } catch (error) {
      console.error('Error loading results:', error);
    }
  }
  
  loadResults();