module surprise_planner::surprise_planner {
    use sui::tx_context::{Self, TxContext};
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use std::string::String;
    use sui::event;

    public struct SurprisePlan has key {
        id: UID,
        title: String,
        creator: address,
        ideas: vector<Idea>,
    }

    public struct Idea has store, copy, drop {
        contributor: address,
        text: String,
        blob_id: String,
    }

    public struct PlanCreated has copy, drop {
        plan_id: ID,
    }

    public struct IdeaAdded has copy, drop {
        plan_id: ID,
        contributor: address,
    }

    public entry fun create_plan(title: String, ctx: &mut TxContext) {
        let plan = SurprisePlan {
            id: object::new(ctx),
            title,
            creator: tx_context::sender(ctx),
            ideas: vector[],
        };
        let plan_id = object::id(&plan);
        transfer::share_object(plan);
        event::emit(PlanCreated { plan_id });
    }

    public entry fun add_idea(
        plan: &mut SurprisePlan,
        text: String,
        blob_id: String,
        ctx: &mut TxContext
    ) {
        let contributor = tx_context::sender(ctx);
        plan.ideas.push_back(Idea { contributor, text, blob_id });
        event::emit(IdeaAdded {
            plan_id: object::id(plan),
            contributor,
        });
    }
}
