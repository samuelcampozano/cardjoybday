module surprise_planner::surprise_planner {
    use std::string::String;
    use sui::event;

    const ENotCreator: u64 = 0;
    const EAlreadyFinalized: u64 = 1;
    const ENotEditable: u64 = 2;

    public struct SurprisePlan has key {
        id: UID,
        title: String,
        creator: address,
        recipient: Option<address>,
        wishes: vector<Wish>,
        final_card_blob_id: Option<String>,
        is_finalized: bool,
    }

    public struct Wish has store, copy, drop {
        contributor: address,
        text: String,
    }

    public struct PlanCreated has copy, drop {
        plan_id: ID,
        creator: address,
    }

    public struct WishAdded has copy, drop {
        plan_id: ID,
        contributor: address,
    }

    public struct CardFinalized has copy, drop {
        plan_id: ID,
        recipient: address,
        blob_id: String,
    }

    entry fun create_plan(title: String, ctx: &mut TxContext) {
        let creator = tx_context::sender(ctx);
        let plan = SurprisePlan {
            id: object::new(ctx),
            title,
            creator,
            recipient: option::none(),
            wishes: vector[],
            final_card_blob_id: option::none(),
            is_finalized: false,
        };
        let plan_id = object::id(&plan);
        event::emit(PlanCreated { plan_id, creator });
        transfer::share_object(plan);
    }

    entry fun add_wish(
        plan: &mut SurprisePlan,
        text: String,
        ctx: &TxContext
    ) {
        assert!(!plan.is_finalized, ENotEditable);
        let contributor = tx_context::sender(ctx);
        plan.wishes.push_back(Wish { contributor, text });
        event::emit(WishAdded {
            plan_id: object::id(plan),
            contributor,
        });
    }

    entry fun finalize_card(
        plan: &mut SurprisePlan,
        blob_id: String,
        recipient: address,
        ctx: &TxContext
    ) {
        assert!(tx_context::sender(ctx) == plan.creator, ENotCreator);
        assert!(!plan.is_finalized, EAlreadyFinalized);
        plan.final_card_blob_id = option::some(blob_id);
        plan.recipient = option::some(recipient);
        plan.is_finalized = true;
        event::emit(CardFinalized {
            plan_id: object::id(plan),
            recipient,
            blob_id,
        });
    }
}
