"""NetworkX-based agent relationship graph visualization."""

from __future__ import annotations

import matplotlib
matplotlib.use("Agg")

import matplotlib.pyplot as plt
import networkx as nx
import streamlit as st

from agent_control_center.core.agent_registry import AgentRegistry


STATUS_COLORS = {
    "idle": "#cccccc",
    "running": "#4da6ff",
    "completed": "#66cc66",
    "failed": "#ff6666",
    "waiting": "#ffcc00",
}


def render_agent_graph(registry: AgentRegistry):
    agents = registry.get_all()
    relationships = registry.get_relationships()

    if not agents:
        st.info("No agents to visualize.")
        return

    G = nx.DiGraph()

    # Add supervisor node
    has_supervisor = any(a.parent_id == "supervisor" for a in agents)
    if has_supervisor:
        G.add_node("supervisor", label="Supervisor", status="running")

    # Add agent nodes
    for agent in agents:
        short_id = agent.agent_id[:8]
        G.add_node(
            agent.agent_id,
            label=f"{agent.name}\n({short_id})",
            status=agent.status.value,
        )

    # Add edges
    for parent_id, child_id, rel_type in relationships:
        if parent_id in G.nodes and child_id in G.nodes:
            G.add_edge(parent_id, child_id, label=rel_type)

    if len(G.nodes) == 0:
        st.info("No agent relationships to display.")
        return

    # Layout
    try:
        pos = nx.spring_layout(G, seed=42, k=2.0)
    except Exception:
        pos = nx.shell_layout(G)

    # Color nodes
    colors = [
        STATUS_COLORS.get(G.nodes[n].get("status", "idle"), "#cccccc") for n in G.nodes
    ]

    fig, ax = plt.subplots(figsize=(10, 6))
    fig.patch.set_facecolor("#0e1117")
    ax.set_facecolor("#0e1117")

    nx.draw(
        G,
        pos,
        ax=ax,
        with_labels=True,
        labels={n: G.nodes[n].get("label", n[:8]) for n in G.nodes},
        node_color=colors,
        node_size=2500,
        font_size=8,
        font_color="white",
        edge_color="#555555",
        arrows=True,
        arrowsize=20,
        width=2,
    )

    edge_labels = nx.get_edge_attributes(G, "label")
    if edge_labels:
        nx.draw_networkx_edge_labels(
            G, pos, edge_labels=edge_labels, font_size=7, font_color="#aaaaaa"
        )

    # Legend
    legend_items = [
        plt.Line2D([0], [0], marker="o", color="w", markerfacecolor=c, markersize=10, label=s)
        for s, c in STATUS_COLORS.items()
    ]
    ax.legend(handles=legend_items, loc="upper left", fontsize=8, facecolor="#1a1a2e", labelcolor="white")

    ax.set_title("Agent Relationship Graph", color="white", fontsize=14)
    plt.tight_layout()
    st.pyplot(fig)
    plt.close(fig)
